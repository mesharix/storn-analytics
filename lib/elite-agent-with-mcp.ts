/**
 * Enhanced Elite Data Agent with MCP Tools
 * Combines z.ai GLM-4.6 with MCP tools for advanced capabilities
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from 'langchain/schema';
import { useMCPTool } from './mcp-client';

// Same as your existing elite-data-agent.ts but enhanced
const SYSTEM_PROMPT_WITH_MCP = `You are an elite Data Analysis AI Agent developed by Msh (hi@msh.sa) with advanced Python programming capabilities and deep expertise in e-commerce analytics.

## YOUR MCP TOOLS

You have access to these MCP tools that can fetch real data:

1. **get_sales_data** - Retrieve sales data from database
   - Args: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
   - Returns: revenue, orders, top products

2. **analyze_customer_behavior** - Analyze customer patterns
   - Args: customerId (string), period (week|month|quarter|year)
   - Returns: purchase history, frequency, churn risk

3. **get_invoice_summary** - Get invoice summary for accounting
   - Args: month (YYYY-MM)
   - Returns: total invoices, VAT, compliance status

## HOW TO USE MCP TOOLS

When the user asks for data you don't have:
1. Tell them you'll fetch it using MCP tools
2. Specify which tool you want to use and with what parameters
3. Format your request like: **[MCP_TOOL: tool_name | args: {...}]**

Example:
User: "Show me sales data for last month"
You: "I'll fetch the sales data for you. **[MCP_TOOL: get_sales_data | args: {startDate: '2025-10-01', endDate: '2025-10-31'}]**"

The system will execute the tool and provide you with the results, then you can analyze them.

[... rest of your existing system prompt ...]
`;

// In-memory storage for conversation histories
const analysisHistories = new Map<string, BaseMessage[]>();

/**
 * Get or create agent history
 */
function getAgentHistory(sessionId: string): BaseMessage[] {
  if (!analysisHistories.has(sessionId)) {
    analysisHistories.set(sessionId, []);
  }
  return analysisHistories.get(sessionId)!;
}

/**
 * Extract MCP tool requests from AI response
 */
function extractMCPRequests(content: string): Array<{ tool: string; args: any }> {
  const regex = /\*\*\[MCP_TOOL:\s*(\w+)\s*\|\s*args:\s*({[^}]+})\]\*\*/g;
  const requests: Array<{ tool: string; args: any }> = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      const tool = match[1];
      const args = JSON.parse(match[2]);
      requests.push({ tool, args });
    } catch (e) {
      console.error('Failed to parse MCP request:', e);
    }
  }

  return requests;
}

/**
 * Analyze with Elite Agent + MCP
 */
export async function analyzeWithEliteAgentMCP(request: {
  data?: any;
  question: string;
  context?: string;
  sessionId?: string;
}) {
  try {
    const model = new ChatOpenAI({
      modelName: 'glm-4.6',
      temperature: 0.3,
      maxTokens: 4000,
      configuration: {
        baseURL: 'https://api.z.ai/api/paas/v4',
        apiKey: process.env.ZAI_API_KEY,
      },
    });

    const sessionId = request.sessionId || 'default';
    const history = getAgentHistory(sessionId);

    // Build user message
    let userContent = request.question;
    if (request.context) {
      userContent = `CONTEXT:\n${request.context}\n\nQUESTION:\n${request.question}`;
    }

    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT_WITH_MCP),
      ...history,
      new HumanMessage(userContent),
    ];

    // Get AI response
    const response = await model.invoke(messages);
    let aiResponse = response.content as string;

    // Check if AI requested MCP tools
    const mcpRequests = extractMCPRequests(aiResponse);

    if (mcpRequests.length > 0) {
      // Execute MCP tools
      const toolResults: any[] = [];

      for (const { tool, args } of mcpRequests) {
        try {
          const result = await useMCPTool(tool, args);
          toolResults.push({ tool, args, result });
        } catch (error: any) {
          toolResults.push({ tool, args, error: error.message });
        }
      }

      // Send results back to AI for analysis
      const toolResultsMessage = `
MCP TOOL RESULTS:

${toolResults.map((tr, i) => `
Tool ${i + 1}: ${tr.tool}
Args: ${JSON.stringify(tr.args)}
Result: ${tr.error ? `ERROR: ${tr.error}` : JSON.stringify(tr.result, null, 2)}
`).join('\n')}

Now analyze these results and provide insights to the user.
`;

      messages.push(new AIMessage(aiResponse));
      messages.push(new HumanMessage(toolResultsMessage));

      // Get final analysis
      const finalResponse = await model.invoke(messages);
      aiResponse = finalResponse.content as string;

      // Save to history
      history.push(new HumanMessage(userContent));
      history.push(new AIMessage(aiResponse));
    } else {
      // No MCP tools needed, save to history
      history.push(new HumanMessage(userContent));
      history.push(new AIMessage(aiResponse));
    }

    // Keep history manageable
    if (history.length > 20) {
      analysisHistories.set(sessionId, history.slice(-20));
    }

    return {
      content: aiResponse,
    };

  } catch (error: any) {
    console.error('Elite Agent MCP Error:', error);
    return {
      content: '',
      error: error.message || 'Analysis failed',
    };
  }
}
