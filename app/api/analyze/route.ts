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
      case 'outliers':
        analysisName = 'Outlier Detection';
        // Detect outliers using IQR method
        if (data.length > 0) {
          const columns = Object.keys(data[0] as Record<string, any>);
          const outliers: any = {};

          columns.forEach(col => {
            const values = data.map(row => parseFloat((row as any)[col])).filter(v => !isNaN(v));

            if (values.length > 0) {
              values.sort((a, b) => a - b);
              const q1Index = Math.floor(values.length * 0.25);
              const q3Index = Math.floor(values.length * 0.75);
              const q1 = values[q1Index];
              const q3 = values[q3Index];
              const iqr = q3 - q1;
              const lowerBound = q1 - 1.5 * iqr;
              const upperBound = q3 + 1.5 * iqr;

              const outlierValues = data
                .map((row, idx) => ({ value: parseFloat((row as any)[col]), rowIndex: idx }))
                .filter(item => !isNaN(item.value) && (item.value < lowerBound || item.value > upperBound))
                .slice(0, 10);

              if (outlierValues.length > 0) {
                outliers[col] = {
                  count: outlierValues.length,
                  lowerBound: lowerBound.toFixed(2),
                  upperBound: upperBound.toFixed(2),
                  samples: outlierValues.map(o => o.value.toFixed(2)),
                };
              }
            }
          });

          results = { outliers, totalColumns: Object.keys(outliers).length };
        }
        break;

      case 'trends':
        analysisName = 'Trend Analysis';
        // Analyze trends in numeric columns
        if (data.length > 5) {
          const columns = Object.keys(data[0] as Record<string, any>);
          const trends: any = {};

          columns.forEach(col => {
            const values = data.map(row => parseFloat((row as any)[col])).filter(v => !isNaN(v));

            if (values.length > 5) {
              const firstHalf = values.slice(0, Math.floor(values.length / 2));
              const secondHalf = values.slice(Math.floor(values.length / 2));
              const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
              const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
              const change = ((secondAvg - firstAvg) / firstAvg) * 100;

              trends[col] = {
                direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
                change: change.toFixed(2) + '%',
                firstAvg: firstAvg.toFixed(2),
                secondAvg: secondAvg.toFixed(2),
              };
            }
          });

          results = { trends };
        }
        break;

      case 'quality':
        analysisName = 'Data Quality Check';
        // Check for missing values and duplicates
        if (data.length > 0) {
          const columns = Object.keys(data[0] as Record<string, any>);
          const quality: any = {};

          columns.forEach(col => {
            const values = data.map(row => (row as any)[col]);
            const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
            const uniqueCount = new Set(values).size;

            quality[col] = {
              total: values.length,
              missing: nullCount,
              missingPercent: ((nullCount / values.length) * 100).toFixed(2) + '%',
              unique: uniqueCount,
              duplicates: values.length - uniqueCount,
            };
          });

          results = { quality, totalRows: data.length };
        }
        break;

      case 'summary':
        analysisName = 'Statistical Summary';
        const summary = analyzeDataset(data);
        results = {
          columnStats: summary.columnStats,
        };
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
