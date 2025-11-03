import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all datasets (filtered by user)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // If not authenticated, return empty array
    if (!session || !session.user?.email) {
      return NextResponse.json([]);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    // Only return datasets owned by this user
    const datasets = await prisma.dataset.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            records: true,
            analyses: true,
          },
        },
      },
    });

    return NextResponse.json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

// DELETE a dataset
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      );
    }

    // Verify the dataset belongs to the user before deleting
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    if (dataset.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own datasets' },
        { status: 403 }
      );
    }

    await prisma.dataset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
