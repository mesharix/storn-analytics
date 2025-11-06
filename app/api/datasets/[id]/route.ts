import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
      include: {
        records: {
          take: 100, // Drastically reduced to 100 records for better performance
        },
        analyses: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Only fetch last 5 analyses
        },
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}
