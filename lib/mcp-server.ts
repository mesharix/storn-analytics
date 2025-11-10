/**
 * MCP Server for Storn Analytics
 * Provides tools and resources for AI agents to interact with your data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Define your MCP tools
const TOOLS: Tool[] = [
  {
    name: 'get_sales_data',
    description: 'Retrieve sales data from the database for a specific date range',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'analyze_customer_behavior',
    description: 'Analyze customer purchase patterns and behavior',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Customer ID to analyze',
        },
        period: {
          type: 'string',
          enum: ['week', 'month', 'quarter', 'year'],
          description: 'Time period for analysis',
        },
      },
      required: ['customerId', 'period'],
    },
  },
  {
    name: 'get_invoice_summary',
    description: 'Get summary of invoices for accounting',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: 'Month in YYYY-MM format',
        },
      },
      required: ['month'],
    },
  },
];

/**
 * Handle tool execution
 */
async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_sales_data':
      return await getSalesData(args.startDate, args.endDate);

    case 'analyze_customer_behavior':
      return await analyzeCustomerBehavior(args.customerId, args.period);

    case 'get_invoice_summary':
      return await getInvoiceSummary(args.month);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Get sales data from database
 */
async function getSalesData(startDate: string, endDate: string) {
  // TODO: Connect to your Supabase database
  // Example implementation:
  return {
    startDate,
    endDate,
    totalRevenue: 125000,
    totalOrders: 450,
    averageOrderValue: 277.78,
    topProducts: [
      { name: 'Product A', revenue: 45000, units: 150 },
      { name: 'Product B', revenue: 32000, units: 200 },
    ],
  };
}

/**
 * Analyze customer behavior
 */
async function analyzeCustomerBehavior(customerId: string, period: string) {
  // TODO: Implement customer behavior analysis
  return {
    customerId,
    period,
    totalPurchases: 12,
    totalSpent: 3450,
    avgOrderValue: 287.50,
    purchaseFrequency: `Every ${Math.floor(30 / 12)} days`,
    favoriteCategory: 'Electronics',
    churnRisk: 'Low',
  };
}

/**
 * Get invoice summary for accounting
 */
async function getInvoiceSummary(month: string) {
  // TODO: Query invoices from database
  return {
    month,
    totalInvoices: 85,
    totalRevenue: 425000,
    totalVAT: 63750, // 15% VAT
    vatCompliant: 82,
    vatNonCompliant: 3,
    topSuppliers: [
      { name: 'Supplier A', invoices: 25, amount: 125000 },
      { name: 'Supplier B', invoices: 18, amount: 98000 },
    ],
  };
}

/**
 * Create and start MCP server
 */
export async function startMCPServer() {
  const server = new Server(
    {
      name: 'storn-analytics-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args || {});

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('MCP Server started for Storn Analytics');
}

// Start server if run directly
if (require.main === module) {
  startMCPServer().catch(console.error);
}
