import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeDataset } from '@/lib/dataAnalysis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to upload datasets.' },
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
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
      // Explicitly decode as UTF-8 to support Arabic text
      const text = new TextDecoder('utf-8').decode(buffer);
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
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

    // Apply data transformation rules
    const saudiPaymentMethods = ['STC Pay', 'تمارا', 'مدى', 'حوالة بنكية'];
    parsedData = parsedData.map(row => {
      const transformedRow = { ...row };

      // Rule 2: If payment method is Saudi-based AND both city and country are blank, set defaults
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

      return transformedRow;
    });

    // Analyze the dataset
    const analysis = analyzeDataset(parsedData);

    // Create dataset and records in database
    const dataset = await prisma.dataset.create({
      data: {
        name: name || fileName,
        description: description || null,
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
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process file' },
      { status: 500 }
    );
  }
}
