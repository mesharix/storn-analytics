/**
 * MCP Tools Inspector
 * View all available MCP tools and their details
 * Run: npx ts-node inspect-mcp-tools.ts
 */

import { MCPClient } from './lib/mcp-client';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

async function inspectTools() {
  console.log(`${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║           MCP Tools Inspector                            ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const client = new MCPClient();

  try {
    console.log(`${colors.yellow}Connecting to MCP server...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}✓ Connected${colors.reset}\n`);

    console.log(`${colors.yellow}Fetching available tools...${colors.reset}\n`);
    const tools = await client.listTools();

    console.log(`${colors.bold}Found ${tools.length} tools:${colors.reset}\n`);
    console.log('═'.repeat(60) + '\n');

    tools.forEach((tool: any, index: number) => {
      console.log(`${colors.bold}${colors.blue}Tool ${index + 1}: ${tool.name}${colors.reset}`);
      console.log(`${colors.green}Description:${colors.reset} ${tool.description}`);

      console.log(`\n${colors.cyan}Input Parameters:${colors.reset}`);
      const properties = tool.inputSchema.properties || {};
      const required = tool.inputSchema.required || [];

      Object.entries(properties).forEach(([key, value]: [string, any]) => {
        const isRequired = required.includes(key);
        const requiredBadge = isRequired ? `${colors.yellow}[REQUIRED]${colors.reset}` : '[optional]';
        console.log(`  • ${colors.bold}${key}${colors.reset} ${requiredBadge}`);
        console.log(`    Type: ${value.type}`);
        console.log(`    Description: ${value.description}`);
        if (value.enum) {
          console.log(`    Allowed values: ${value.enum.join(', ')}`);
        }
      });

      console.log('\n' + '─'.repeat(60) + '\n');
    });

    // Show usage examples
    console.log(`${colors.bold}${colors.cyan}Usage Examples:${colors.reset}\n`);

    console.log(`${colors.green}Example 1: Get Sales Data${colors.reset}`);
    console.log(`
curl -X POST http://localhost:3000/api/mcp-tools \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "get_sales_data",
    "args": {
      "startDate": "2024-10-01",
      "endDate": "2024-10-31"
    }
  }'
`);

    console.log(`${colors.green}Example 2: Analyze Customer${colors.reset}`);
    console.log(`
curl -X POST http://localhost:3000/api/mcp-tools \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "analyze_customer_behavior",
    "args": {
      "customerId": "CUST-001",
      "period": "month"
    }
  }'
`);

    console.log(`${colors.green}Example 3: Invoice Summary${colors.reset}`);
    console.log(`
curl -X POST http://localhost:3000/api/mcp-tools \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "get_invoice_summary",
    "args": {
      "month": "2024-10"
    }
  }'
`);

    await client.disconnect();
    console.log(`\n${colors.green}✓ Disconnected${colors.reset}`);

  } catch (error: any) {
    console.error(`${colors.yellow}Error:${colors.reset}`, error.message);
    await client.disconnect();
    process.exit(1);
  }
}

inspectTools();
