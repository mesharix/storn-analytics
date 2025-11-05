import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findCorrelations, analyzeDataset } from '@/lib/dataAnalysis';
import {
  detectEcommerceColumns,
  cleanEcommerceData,
  calculateRevenueMetrics,
  calculateRevenueTrends,
  analyzeProductPerformance,
  performRFMAnalysis,
  analyzeCustomerMetrics,
  performCohortAnalysis,
  forecastRevenue,
} from '@/lib/ecommerceAnalysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, analysisType, columns } = body;

    console.log('Analysis request:', { datasetId, analysisType, columns });

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

    let data = dataset.records.map(r => r.data) as any[];
    console.log('Dataset loaded:', { recordCount: data.length, columns: data.length > 0 && data[0] ? Object.keys(data[0] as Record<string, any>) : [] });

    let results: any = {};
    let analysisName = '';

    // Auto-detect e-commerce columns if not provided
    const detectedColumns = columns || detectEcommerceColumns(data) || {};

    // Clean data: Remove SKU from product names, fill blank cities with N/A, convert VAT text to numbers
    if (detectedColumns.productColumn || detectedColumns.cityColumn || detectedColumns.vatColumn) {
      data = cleanEcommerceData(data, detectedColumns);
      console.log('Data cleaned: SKU removed, blank cities filled with N/A, VAT converted to numeric');
    }

    switch (analysisType) {
      // ===== E-COMMERCE ANALYSES =====
      case 'ecommerce-revenue':
        analysisName = 'Revenue Analytics';
        console.log('Running revenue analytics...');
        if (data.length > 0 && detectedColumns.revenueColumn && detectedColumns.dateColumn) {
          const revenueMetrics = calculateRevenueMetrics(data, detectedColumns.revenueColumn, detectedColumns.dateColumn);
          const revenueTrends = calculateRevenueTrends(data, detectedColumns.revenueColumn, detectedColumns.dateColumn);
          results = {
            metrics: revenueMetrics,
            trends: revenueTrends,
            detectedColumns,
          };
        } else {
          results = { error: 'Could not detect revenue or date columns. Please ensure your data has columns like "revenue", "total", "amount" and "date".' };
        }
        break;

      case 'ecommerce-products':
        analysisName = 'Product Performance';
        console.log('Running product performance analysis...');
        if (data.length > 0 && detectedColumns.productColumn && detectedColumns.revenueColumn) {
          const productPerformance = analyzeProductPerformance(
            data,
            detectedColumns.productColumn,
            detectedColumns.revenueColumn,
            detectedColumns.quantityColumn
          );
          results = { ...productPerformance, detectedColumns };
        } else {
          results = { error: 'Could not detect product or revenue columns. Please ensure your data has columns like "product", "item" and "revenue", "total".' };
        }
        break;

      case 'ecommerce-rfm':
        analysisName = 'RFM Customer Segmentation';
        console.log('Running RFM analysis...');
        if (data.length > 0 && detectedColumns.customerColumn && detectedColumns.dateColumn && detectedColumns.revenueColumn) {
          const rfmResults = performRFMAnalysis(
            data,
            detectedColumns.customerColumn,
            detectedColumns.dateColumn,
            detectedColumns.revenueColumn
          );
          results = { ...rfmResults, detectedColumns };
        } else {
          results = { error: 'Could not detect customer, date, or revenue columns. Please ensure your data has columns like "customer", "date", and "revenue".' };
        }
        break;

      case 'ecommerce-customers':
        analysisName = 'Customer Analytics';
        console.log('Running customer analytics...');
        if (data.length > 0 && detectedColumns.customerColumn && detectedColumns.revenueColumn) {
          const customerMetrics = analyzeCustomerMetrics(
            data,
            detectedColumns.customerColumn,
            detectedColumns.revenueColumn
          );
          results = { ...customerMetrics, detectedColumns };
        } else {
          results = { error: 'Could not detect customer or revenue columns.' };
        }
        break;

      case 'ecommerce-cohorts':
        analysisName = 'Cohort Analysis';
        console.log('Running cohort analysis...');
        if (data.length > 0 && detectedColumns.customerColumn && detectedColumns.dateColumn && detectedColumns.revenueColumn) {
          const cohortResults = performCohortAnalysis(
            data,
            detectedColumns.customerColumn,
            detectedColumns.dateColumn,
            detectedColumns.revenueColumn
          );
          results = { ...cohortResults, detectedColumns };
        } else {
          results = { error: 'Could not detect customer, date, or revenue columns.' };
        }
        break;

      case 'ecommerce-forecast':
        analysisName = 'Revenue Forecast';
        console.log('Running revenue forecasting...');
        if (data.length > 0 && detectedColumns.dateColumn && detectedColumns.revenueColumn) {
          const forecastResults = forecastRevenue(
            data,
            detectedColumns.dateColumn,
            detectedColumns.revenueColumn,
            30 // 30 days ahead
          );
          results = { ...forecastResults, detectedColumns };
        } else {
          results = { error: 'Could not detect date or revenue columns.' };
        }
        break;

      // ===== LEGACY ANALYSES (Keep for backward compatibility) =====
      case 'outliers':
        analysisName = 'Outlier Detection';
        console.log('Running outlier detection...');
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
          console.log('Outlier detection complete:', { columnsWithOutliers: Object.keys(outliers).length });
        }
        break;

      case 'trends':
        analysisName = 'Trend Analysis';
        console.log('Running trend analysis...');
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
          console.log('Trend analysis complete:', { columnsAnalyzed: Object.keys(trends).length });
        } else {
          console.log('Not enough data for trend analysis. Need > 5 rows, got:', data.length);
        }
        break;

      case 'quality':
        analysisName = 'Data Quality Check';
        console.log('Running data quality check...');
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
          console.log('Data quality check complete:', { columnsChecked: Object.keys(quality).length });
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
    console.log('Saving analysis to database...', { analysisName, type: analysisType, hasResults: Object.keys(results).length > 0 });

    const analysis = await prisma.analysis.create({
      data: {
        datasetId,
        name: analysisName,
        type: analysisType,
        results: results as any,
      },
    });

    console.log('Analysis saved successfully:', analysis.id);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error performing analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform analysis';
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}
