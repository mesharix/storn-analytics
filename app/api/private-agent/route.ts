import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithPrivateAgent, chatWithPrivateAgent } from '@/lib/private-agent';

/**
 * Private AI Agent API Endpoint
 * Secret access only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, question, context, sessionId } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const result = await analyzeWithPrivateAgent({
      data,
      question,
      context,
      sessionId: sessionId || `session-${Date.now()}`,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: result.content,
    });

  } catch (error: any) {
    console.error('Private Agent API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
