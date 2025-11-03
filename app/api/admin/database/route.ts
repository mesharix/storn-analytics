import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all datasets with their counts
    const datasets = await prisma.dataset.findMany({
      include: {
        _count: {
          select: {
            records: true,
            analyses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total counts
    const totalDatasets = await prisma.dataset.count();
    const totalRecords = await prisma.record.count();
    const totalAnalyses = await prisma.analysis.count();

    // Get recent analyses
    const recentAnalyses = await prisma.analysis.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dataset: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      summary: {
        totalDatasets,
        totalRecords,
        totalAnalyses,
      },
      datasets: datasets.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        rowCount: d.rowCount,
        columnCount: d.columnCount,
        recordsInDB: d._count.records,
        analysesCount: d._count.analyses,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      recentAnalyses: recentAnalyses.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        datasetName: a.dataset.name,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database info', details: error },
      { status: 500 }
    );
  }
}
