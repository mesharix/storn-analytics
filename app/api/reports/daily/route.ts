import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  detectEcommerceColumns,
  cleanEcommerceData,
  calculateRevenueMetrics,
  analyzeProductPerformance,
  analyzeCustomerMetrics,
} from '@/lib/ecommerceAnalysis';

// This endpoint generates a daily report for the latest dataset
// Can be called by n8n with API key authentication
export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Add x-api-key header.' },
        { status: 401 }
      );
    }

    // Find user (for now, use admin email from env)
    const user = await prisma.user.findFirst({
      where: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      },
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
      include: {
        records: true,
      },
    });

    if (!latestDataset) {
      return NextResponse.json(
        { error: 'No datasets found' },
        { status: 404 }
      );
    }

    // Get data from records
    let data = latestDataset.records.map(r => r.data) as any[];

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Dataset has no records' },
        { status: 400 }
      );
    }

    // Auto-detect e-commerce columns
    const detectedColumns = detectEcommerceColumns(data) || {};

    // Clean data
    if (detectedColumns.productColumn || detectedColumns.cityColumn || detectedColumns.vatColumn) {
      data = cleanEcommerceData(data, detectedColumns);
    }

    // Generate comprehensive report
    const report: any = {
      generatedAt: new Date().toISOString(),
      datasetInfo: {
        id: latestDataset.id,
        name: latestDataset.name,
        fileName: latestDataset.fileName,
        uploadedAt: latestDataset.uploadedAt,
        rowCount: latestDataset.rowCount,
        columnCount: latestDataset.columnCount,
      },
      summary: {},
      revenue: null,
      products: null,
      customers: null,
    };

    // Calculate revenue metrics if possible
    if (detectedColumns.revenueColumn && detectedColumns.dateColumn) {
      const revenueMetrics = calculateRevenueMetrics(
        data,
        detectedColumns.revenueColumn,
        detectedColumns.dateColumn
      );
      report.revenue = revenueMetrics;
      report.summary.totalRevenue = revenueMetrics.totalRevenue;
      report.summary.averageOrderValue = revenueMetrics.averageOrderValue;
      report.summary.totalOrders = revenueMetrics.totalOrders;
    }

    // Analyze product performance
    if (detectedColumns.productColumn && detectedColumns.revenueColumn) {
      const productPerformance = analyzeProductPerformance(
        data,
        detectedColumns.productColumn,
        detectedColumns.revenueColumn,
        detectedColumns.quantityColumn
      );
      report.products = {
        topProducts: productPerformance.topProducts.slice(0, 10),
        totalProducts: productPerformance.totalProducts,
      };
    }

    // Analyze customer metrics
    if (detectedColumns.customerColumn && detectedColumns.revenueColumn) {
      const customerMetrics = analyzeCustomerMetrics(
        data,
        detectedColumns.customerColumn,
        detectedColumns.revenueColumn
      );
      report.customers = {
        totalCustomers: customerMetrics.totalCustomers,
        averageCustomerValue: customerMetrics.averageCustomerValue,
        topCustomers: customerMetrics.topCustomers.slice(0, 10),
      };
    }

    // Generate human-readable summary
    report.summary.datasetName = latestDataset.name;
    report.summary.recordCount = data.length;
    report.summary.reportDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST version for triggering report generation with custom parameters
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { datasetId, email } = body;

    // If datasetId is provided, use that specific dataset
    let dataset;
    if (datasetId) {
      dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
        include: { records: true },
      });
    } else {
      // Otherwise, get the latest dataset
      const user = await prisma.user.findFirst({
        where: {
          email: process.env.ADMIN_EMAIL || 'admin@example.com'
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      dataset = await prisma.dataset.findFirst({
        where: { userId: user.id },
        orderBy: { uploadedAt: 'desc' },
        include: { records: true },
      });
    }

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Generate report (same logic as GET)
    let data = dataset.records.map(r => r.data) as any[];
    const detectedColumns = detectEcommerceColumns(data) || {};

    if (detectedColumns.productColumn || detectedColumns.cityColumn || detectedColumns.vatColumn) {
      data = cleanEcommerceData(data, detectedColumns);
    }

    const report: any = {
      generatedAt: new Date().toISOString(),
      datasetInfo: {
        id: dataset.id,
        name: dataset.name,
        fileName: dataset.fileName,
        uploadedAt: dataset.uploadedAt,
        rowCount: dataset.rowCount,
      },
      summary: {},
    };

    if (detectedColumns.revenueColumn && detectedColumns.dateColumn) {
      const revenueMetrics = calculateRevenueMetrics(
        data,
        detectedColumns.revenueColumn,
        detectedColumns.dateColumn
      );
      report.revenue = revenueMetrics;
    }

    if (detectedColumns.productColumn && detectedColumns.revenueColumn) {
      const productPerformance = analyzeProductPerformance(
        data,
        detectedColumns.productColumn,
        detectedColumns.revenueColumn,
        detectedColumns.quantityColumn
      );
      report.products = {
        topProducts: productPerformance.topProducts.slice(0, 10),
      };
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
