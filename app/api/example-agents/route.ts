import { NextRequest, NextResponse } from 'next/server';
import {
  simpleQAAgent,
  chatAgent,
  clearChat,
  weatherAgentWithTools,
  mathTutorAgent,
  multiAgentSystem,
  sentimentAnalysisAgent,
  chainOfThoughtAgent,
  codeGeneratorAgent,
  translationAgent,
  dataExtractionAgent,
} from '@/lib/example-agents';

export async function POST(request: NextRequest) {
  try {
    const { agentType, ...params } = await request.json();

    if (!agentType) {
      return NextResponse.json(
        { error: 'agentType is required' },
        { status: 400 }
      );
    }

    let result;

    switch (agentType) {
      // Example 1: Simple Q&A
      case 'simple-qa':
        if (!params.question) {
          return NextResponse.json({ error: 'question required' }, { status: 400 });
        }
        result = await simpleQAAgent(params.question);
        break;

      // Example 2: Chat with Memory
      case 'chat':
        if (!params.message) {
          return NextResponse.json({ error: 'message required' }, { status: 400 });
        }
        result = await chatAgent(params.message, params.sessionId || 'default');
        break;

      case 'clear-chat':
        clearChat(params.sessionId || 'default');
        result = { success: true, message: 'Chat history cleared' };
        break;

      // Example 3: Weather with Tools
      case 'weather':
        if (!params.query) {
          return NextResponse.json({ error: 'query required' }, { status: 400 });
        }
        result = await weatherAgentWithTools(params.query);
        break;

      // Example 4: Math Tutor
      case 'math-tutor':
        if (!params.problem) {
          return NextResponse.json({ error: 'problem required' }, { status: 400 });
        }
        result = await mathTutorAgent(params.problem);
        break;

      // Example 5: Multi-Agent System
      case 'support':
        if (!params.query) {
          return NextResponse.json({ error: 'query required' }, { status: 400 });
        }
        result = await multiAgentSystem(params.query);
        break;

      // Example 6: Sentiment Analysis
      case 'sentiment':
        if (!params.text) {
          return NextResponse.json({ error: 'text required' }, { status: 400 });
        }
        result = await sentimentAnalysisAgent(params.text);
        break;

      // Example 7: Chain of Thought
      case 'chain-of-thought':
        if (!params.problem) {
          return NextResponse.json({ error: 'problem required' }, { status: 400 });
        }
        result = await chainOfThoughtAgent(params.problem);
        break;

      // Example 8: Code Generator
      case 'code-gen':
        if (!params.description) {
          return NextResponse.json({ error: 'description required' }, { status: 400 });
        }
        result = await codeGeneratorAgent(
          params.description,
          params.language || 'typescript'
        );
        break;

      // Example 9: Translation
      case 'translate':
        if (!params.text || !params.targetLanguage) {
          return NextResponse.json(
            { error: 'text and targetLanguage required' },
            { status: 400 }
          );
        }
        result = await translationAgent(
          params.text,
          params.targetLanguage,
          params.context
        );
        break;

      // Example 10: Data Extraction
      case 'extract':
        if (!params.text || !params.fields) {
          return NextResponse.json(
            { error: 'text and fields required' },
            { status: 400 }
          );
        }
        result = await dataExtractionAgent(params.text, params.fields);
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
    console.error('Example Agent Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process agent request',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
