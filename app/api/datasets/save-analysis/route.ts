import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Save AI analysis to database
 *
 * Creates a new dataset with the uploaded data and stores the AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Get user from database (optional - can save without auth)
    let userId: string | null = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id || null;
    }

    const { name, data, analysis, analyzedAt } = await request.json();

    if (!name || !data || !analysis) {
      return NextResponse.json(
        { error: 'name, data, and analysis are required' },
        { status: 400 }
      );
    }

    // Calculate dataset stats
    const dataArray = Array.isArray(data) ? data : [];
    const rowCount = dataArray.length;
    const columnCount = rowCount > 0 ? Object.keys(dataArray[0] || {}).length : 0;

    // Create dataset
    const dataset = await prisma.dataset.create({
      data: {
        name,
        description: `AI-analyzed on ${new Date(analyzedAt || Date.now()).toLocaleString()}`,
        fileName: name,
        fileSize: JSON.stringify(data).length, // Approximate file size
        rowCount,
        columnCount,
        uploadedAt: new Date(analyzedAt || Date.now()),
        userId,
        isPublic: false,
      },
    });

    // Save records to the dataset
    if (dataArray.length > 0) {
      const records = dataArray.map((row: any) => ({
        datasetId: dataset.id,
        data: row,
      }));

      await prisma.record.createMany({
        data: records,
      });
    }

    // Save AI analysis
    await prisma.analysis.create({
      data: {
        datasetId: dataset.id,
        name: 'AI Analysis',
        type: 'ai-generated',
        results: {
          analysis,
          timestamp: analyzedAt || new Date().toISOString(),
          model: 'GLM-4.6',
        },
      },
    });

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        rowCount,
        columnCount,
      },
    });

  } catch (error: any) {
    console.error('Error saving analysis to database:', error);
    return NextResponse.json(
      {
        error: 'Failed to save analysis',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
