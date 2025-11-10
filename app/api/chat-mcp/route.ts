/**
 * MCP Chat API Route
 * Handles chat requests with Elite Agent + MCP tools
 * Author: Msh (hi@msh.sa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithEliteAgentMCP } from '@/lib/elite-agent-with-mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call Elite Agent with MCP
    const response = await analyzeWithEliteAgentMCP({
      question: message,
      sessionId: sessionId || 'default',
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      );
    }

    // Extract which tools were used (if any)
    const usedTools: string[] = [];
    const toolPattern = /\*\*\[MCP_TOOL:\s*(\w+)/g;
    let match;
    while ((match = toolPattern.exec(response.content)) !== null) {
      usedTools.push(match[1]);
    }

    return NextResponse.json({
      message: response.content,
      usedTools: usedTools.length > 0 ? usedTools : undefined,
    });

  } catch (error: any) {
    console.error('Chat MCP Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
