import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeDataset } from '@/lib/dataAnalysis';

export async function POST(request: NextRequest) {
  try {
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
      const text = new TextDecoder().decode(buffer);
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
