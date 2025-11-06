import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeDataset } from '@/lib/dataAnalysis';

// This endpoint accepts API key authentication for automated uploads
export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // Find user by API key (you'll need to add API key to user model later)
    // For now, we'll use the API key as a simple auth token
    const user = await prisma.user.findFirst({
      where: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com' // Default to admin user
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || 'Automated Upload';
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    const fileSize = file.size;

    let parsedData: any[] = [];

    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      const text = new TextDecoder('utf-8').decode(buffer);
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });
      parsedData = result.data;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedData = XLSX.utils.sheet_to_json(firstSheet);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV or Excel files.' },
        { status: 400 }
      );
    }

    if (parsedData.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or could not be parsed' },
        { status: 400 }
      );
    }

    // Apply data transformation rules (same as manual upload)
    const saudiPaymentMethods = ['STC Pay', 'تمارا', 'مدى', 'حوالة بنكية'];
    parsedData = parsedData.map(row => {
      const transformedRow = { ...row };

      // Rule 1: Clean product name
      const oldProductColumn = 'اسماء المنتجات مع SKU';
      const newProductColumn = 'اسم المنتج';

      if (transformedRow[oldProductColumn] && typeof transformedRow[oldProductColumn] === 'string') {
        let cleanProduct = transformedRow[oldProductColumn]
          .replace(/\s*-\s*SKU[:\s]*.*/i, '')
          .replace(/\s*\(SKU[:\s]*.*?\)/i, '')
          .replace(/\s*SKU[:\s]*.*/i, '')
          .replace(/\s*\(Qty[:\s]*.*?\)/i, '')
          .replace(/\s*Qty[:\s]*.*/i, '')
          .replace(/\s*-\s*\d+\s*$/, '')
          .replace(/[()]/g, '')
          .replace(/['"]/g, '')
          .trim();

        transformedRow[newProductColumn] = cleanProduct;
        delete transformedRow[oldProductColumn];
      }

      // Rule 2: Saudi payment methods default location
      const paymentMethod = transformedRow['طريقة الدفع'];
      const city = transformedRow['المدينة'];
      const country = transformedRow['الدولة'];

      if (paymentMethod && saudiPaymentMethods.includes(paymentMethod)) {
        const isCityBlank = !city || city === '' || city === null || city === undefined;
        const isCountryBlank = !country || country === '' || country === null || country === undefined;

        if (isCityBlank && isCountryBlank) {
          transformedRow['المدينة'] = 'Riyadh';
          transformedRow['الدولة'] = 'Saudi Arabia';
        }
      }

      // Rule 3: Clean VAT
      const vatColumn = 'الضريبة';
      if (vatColumn in transformedRow) {
        const vatValue = transformedRow[vatColumn];
        if (vatValue === null || vatValue === undefined || vatValue === '') {
          transformedRow[vatColumn] = 0;
        } else if (typeof vatValue === 'string') {
          const lowerVat = vatValue.toLowerCase().trim();
          if (lowerVat === 'none' || lowerVat === 'zero' || lowerVat === 'n/a' ||
              lowerVat === 'nil' || lowerVat === 'na' || lowerVat === '-' || lowerVat === '') {
            transformedRow[vatColumn] = 0;
          } else {
            const parsed = parseFloat(vatValue);
            transformedRow[vatColumn] = isNaN(parsed) ? 0 : parsed;
          }
        } else if (typeof vatValue === 'number') {
          transformedRow[vatColumn] = isNaN(vatValue) ? 0 : vatValue;
        } else {
          transformedRow[vatColumn] = 0;
        }
      }

      // Rule 4: Transform Order Status
      const orderStatusColumn = 'حالة الطلب';
      if (orderStatusColumn in transformedRow) {
        const statusValue = transformedRow[orderStatusColumn];
        if (statusValue && typeof statusValue === 'string') {
          const trimmedStatus = statusValue.trim();
          transformedRow[orderStatusColumn] = trimmedStatus === 'تم التنفيذ' ? 'Completed' : 'Not Completed';
        } else {
          transformedRow[orderStatusColumn] = 'Not Completed';
        }
      }

      // Rule 5: Clean Shipping Cost
      const shippingCostColumn = 'تكلفة الشحن';
      if (shippingCostColumn in transformedRow) {
        const shippingValue = transformedRow[shippingCostColumn];
        if (shippingValue === null || shippingValue === undefined || shippingValue === '') {
          transformedRow[shippingCostColumn] = 0;
        } else if (typeof shippingValue === 'string') {
          const lowerShipping = shippingValue.toLowerCase().trim();
          if (lowerShipping === 'none' || lowerShipping === 'zero' || lowerShipping === 'n/a' ||
              lowerShipping === 'nil' || lowerShipping === 'na' || lowerShipping === '-' ||
              lowerShipping === 'free' || lowerShipping === 'مجاني' || lowerShipping === '') {
            transformedRow[shippingCostColumn] = 0;
          } else {
            const parsed = parseFloat(shippingValue);
            transformedRow[shippingCostColumn] = isNaN(parsed) ? 0 : parsed;
          }
        } else if (typeof shippingValue === 'number') {
          transformedRow[shippingCostColumn] = isNaN(shippingValue) ? 0 : shippingValue;
        } else {
          transformedRow[shippingCostColumn] = 0;
        }
      }

      return transformedRow;
    });

    // Analyze the dataset
    const analysis = analyzeDataset(parsedData);

    // Create dataset and records in database
    const dataset = await prisma.dataset.create({
      data: {
        name: name || fileName,
        description: description || 'Automated upload',
        fileName,
        fileSize,
        rowCount: analysis.rowCount,
        columnCount: analysis.columnCount || 0,
        userId: user.id,
        isPublic: false,
        records: {
          create: parsedData.map(row => ({
            data: row,
          })),
        },
        analyses: {
          create: {
            name: 'Initial Analysis',
            type: 'summary',
            results: {
              columnStats: analysis.columnStats,
            } as any,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
      },
    });
  } catch (error) {
    console.error('Error in automated upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process file' },
      { status: 500 }
    );
  }
}
