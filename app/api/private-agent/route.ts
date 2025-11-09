import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithPrivateAgent, chatWithPrivateAgent } from '@/lib/private-agent';

/**
 * Private AI Agent API Endpoint
 * Secret access only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, question, context, sessionId, images } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // If images are provided, add them to the data
    let requestData = data;
    if (images && images.length > 0) {
      requestData = {
        ...(data || {}),
        images,
        imageCount: images.length,
      };
    }

    const result = await analyzeWithPrivateAgent({
      data: requestData,
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
