import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithEliteAgent, chatWithEliteAgent, clearEliteAgentMemory } from '@/lib/elite-data-agent';

/**
 * API Route for Elite Data Analysis Agent
 *
 * This endpoint accepts:
 * - data: Your dataset (JSON, array, CSV text, etc.) - OPTIONAL
 * - question: The analysis question - REQUIRED
 * - context: Business context - OPTIONAL
 * - sessionId: For conversation memory - OPTIONAL
 * - action: 'analyze' (default), 'chat', or 'clear' - OPTIONAL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, question, context, sessionId, action = 'analyze' } = body;

    // Action: Clear memory
    if (action === 'clear') {
      clearEliteAgentMemory(sessionId || 'default');
      return NextResponse.json({
        success: true,
        message: 'Conversation memory cleared',
      });
    }

    // Action: Chat (follow-up without new data)
    if (action === 'chat') {
      if (!question) {
        return NextResponse.json(
          { error: 'question is required for chat' },
          { status: 400 }
        );
      }

      const result = await chatWithEliteAgent(question, sessionId || 'default');

      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to chat with elite agent', details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        analysis: result.content,
        action: 'chat',
      });
    }

    // Action: Analyze (default)
    if (!question) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    const result = await analyzeWithEliteAgent({
      data,
      question,
      context,
      sessionId: sessionId || 'default',
    });

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to analyze data', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: result.content,
      action: 'analyze',
    });

  } catch (error: any) {
    console.error('Elite Analyst API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
