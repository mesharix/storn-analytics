import { NextRequest, NextResponse } from 'next/server';
import { useMCPTool } from '@/lib/mcp-client';

/**
 * MCP Tools API Endpoint
 * Allows frontend to call MCP tools
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, args } = body;

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Call the MCP tool
    const result = await useMCPTool(tool, args || {});

    return NextResponse.json({
      success: true,
      tool,
      result,
    });

  } catch (error: any) {
    console.error('MCP Tool Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute MCP tool' },
      { status: 500 }
    );
  }
}

/**
 * GET - List available MCP tools
 */
export async function GET() {
  try {
    const { MCPClient } = await import('@/lib/mcp-client');
    const client = new MCPClient();

    await client.connect();
    const tools = await client.listTools();
    await client.disconnect();

    return NextResponse.json({
      success: true,
      tools,
    });

  } catch (error: any) {
    console.error('MCP List Tools Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list MCP tools' },
      { status: 500 }
    );
  }
}
