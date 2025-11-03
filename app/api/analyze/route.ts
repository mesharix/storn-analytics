import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findCorrelations, analyzeDataset } from '@/lib/dataAnalysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, analysisType } = body;

    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      );
    }

    // Fetch dataset with records
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: {
        records: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const data = dataset.records.map(r => r.data);
    let results: any = {};
    let analysisName = '';

    switch (analysisType) {
      case 'correlation':
        analysisName = 'Correlation Analysis';
        results = {
          correlations: findCorrelations(data, 0.3), // Lower threshold to show more relationships
        };
        break;

      case 'summary':
        analysisName = 'Statistical Summary';
        const summary = analyzeDataset(data);
        results = {
          columnStats: summary.columnStats,
        };
        break;

      case 'distribution':
        analysisName = 'Distribution Analysis';
        // Get frequency distributions for each column
        if (data.length > 0) {
          const columns = Object.keys(data[0] as Record<string, any>);
          const distributions: any = {};

          columns.forEach(col => {
            const values = data.map(row => (row as any)[col]);
            const freq: Record<string, number> = {};

            values.forEach(val => {
              const key = String(val);
              freq[key] = (freq[key] || 0) + 1;
            });

            // Get top 20 most frequent values
            const sorted = Object.entries(freq)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20);

            distributions[col] = sorted.map(([value, count]) => ({
              value,
              count,
              percentage: ((count / values.length) * 100).toFixed(2),
            }));
          });

          results = { distributions };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        datasetId,
        name: analysisName,
        type: analysisType,
        results: results as any,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error performing analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform analysis' },
      { status: 500 }
    );
  }
}
