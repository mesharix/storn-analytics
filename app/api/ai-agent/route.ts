import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithLangChain } from '@/lib/langchain-agent';

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, sessionId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Prepare dataset context if provided
    const datasetContext = context ? {
      name: context.name || 'Untitled Dataset',
      totalRecords: context.totalRecords || 0,
      columns: context.columns || [],
      sampleData: context.sampleData || []
    } : undefined;

    // Use LangChain with conversation memory
    const result = await analyzeWithLangChain({
      prompt,
      context: datasetContext,
      sessionId: sessionId || 'default'
    });

    if (result.error) {
      return NextResponse.json(
        {
          error: 'Failed to call GLM-4.6 API via LangChain',
          details: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: result.content,
      finish_reason: 'stop'
    });

  } catch (error: any) {
    console.error('LangChain API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to call GLM-4.6 API via LangChain',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
