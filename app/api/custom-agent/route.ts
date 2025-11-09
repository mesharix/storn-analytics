import { NextRequest, NextResponse } from 'next/server';
import {
  salesAssistantAgent,
  codeReviewAgent,
  contentWriterAgent,
  customerSupportAgent,
  orchestratorAgent,
} from '@/lib/custom-ai-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentType, ...agentRequest } = body;

    if (!agentType) {
      return NextResponse.json(
        { error: 'Agent type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (agentType) {
      case 'sales':
        result = await salesAssistantAgent(agentRequest);
        break;

      case 'code-review':
        result = await codeReviewAgent(agentRequest);
        break;

      case 'content-writer':
        result = await contentWriterAgent(agentRequest);
        break;

      case 'support':
        result = await customerSupportAgent(agentRequest);
        break;

      case 'orchestrator':
        result = await orchestratorAgent(agentRequest);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown agent type: ${agentType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      agentType,
      result,
    });

  } catch (error: any) {
    console.error('Custom Agent Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process agent request',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
