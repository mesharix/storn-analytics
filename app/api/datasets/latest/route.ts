import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the latest dataset for this user
    const latestDataset = await prisma.dataset.findFirst({
      where: { userId: user.id },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        rowCount: true,
        columnCount: true,
        uploadedAt: true,
      },
    });

    if (!latestDataset) {
      return NextResponse.json(
        { error: 'No datasets found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataset: latestDataset,
    });
  } catch (error) {
    console.error('Error fetching latest dataset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest dataset' },
      { status: 500 }
    );
  }
}
