/**
 * MCP Client for Storn Analytics
 * Allows AI agents to use MCP tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  /**
   * Connect to MCP server
   */
  async connect() {
    // Spawn the MCP server process
    const serverProcess = spawn('node', [
      '-r',
      'ts-node/register',
      './lib/mcp-server.ts',
    ]);

    // Create stdio transport
    this.transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin,
    });

    // Create client
    this.client = new Client(
      {
        name: 'storn-analytics-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect client to server
    await this.client.connect(this.transport);

    console.log('Connected to MCP server');
  }

  /**
   * List available tools
   */
  async listTools() {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const response = await this.client.request({
      method: 'tools/list',
    }, {});

    return response.tools;
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, any>) {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }

    const response = await this.client.request({
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }, {});

    // Extract text from response
    if (response.content && response.content[0]) {
      const text = response.content[0].text;
      return JSON.parse(text);
    }

    return null;
  }

  /**
   * Disconnect from server
   */
  async disconnect() {
    if (this.client && this.transport) {
      await this.client.close();
      await this.transport.close();
      this.client = null;
      this.transport = null;
    }
  }
}

/**
 * Helper function to use MCP tools in API routes
 */
export async function useMCPTool(toolName: string, args: Record<string, any>) {
  const client = new MCPClient();

  try {
    await client.connect();
    const result = await client.callTool(toolName, args);
    await client.disconnect();
    return result;
  } catch (error) {
    await client.disconnect();
    throw error;
  }
}
