# How to Add New MCP Tools

## Understanding MCP Tools

MCP tools are **custom functions** you create that your AI can use. They're not "installed" from a package - you write them yourself to match your business needs.

## Current Tools

You have 3 tools right now:

| Tool | Purpose | File Location |
|------|---------|---------------|
| `get_sales_data` | Fetch sales from database | [lib/mcp-server.ts:17-33](lib/mcp-server.ts#L17-L33) |
| `analyze_customer_behavior` | Analyze customer patterns | [lib/mcp-server.ts:34-52](lib/mcp-server.ts#L34-L52) |
| `get_invoice_summary` | Get invoice summaries | [lib/mcp-server.ts:53-63](lib/mcp-server.ts#L53-L63) |

## How to Inspect Tools

Run this command to see all tools and their details:

```bash
npx ts-node inspect-mcp-tools.ts
```

This will show you:
- Tool name
- Description
- Required parameters
- Parameter types
- Usage examples

## How to Add a New Tool (Step by Step)

### Example: Adding a "Get Product Inventory" Tool

Let's add a tool that checks product inventory levels.

#### Step 1: Define the Tool

Edit [lib/mcp-server.ts](lib/mcp-server.ts) and add to the `TOOLS` array:

```typescript
const TOOLS: Tool[] = [
  // ... existing tools ...

  // NEW TOOL
  {
    name: 'get_product_inventory',
    description: 'Get current inventory levels for products',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to check (optional, leave empty for all products)',
        },
        lowStockOnly: {
          type: 'boolean',
          description: 'Only show products with low stock',
        },
      },
      required: [], // Nothing is required, all parameters are optional
    },
  },
];
```

#### Step 2: Implement the Tool Logic

In the same file, add to the `handleToolCall` function:

```typescript
async function handleToolCall(name: string, args: any) {
  switch (name) {
    case 'get_sales_data':
      return await getSalesData(args);

    case 'analyze_customer_behavior':
      return await analyzeCustomerBehavior(args);

    case 'get_invoice_summary':
      return await getInvoiceSummary(args);

    // NEW TOOL HANDLER
    case 'get_product_inventory':
      return await getProductInventory(args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

#### Step 3: Write the Implementation Function

Add the actual function that queries your database:

```typescript
/**
 * Get product inventory levels
 */
async function getProductInventory(args: {
  productId?: string;
  lowStockOnly?: boolean;
}) {
  // TODO: Replace with real database query
  // Example with Supabase:
  /*
  const query = supabase.from('products').select('*');

  if (args.productId) {
    query.eq('id', args.productId);
  }

  if (args.lowStockOnly) {
    query.lt('stock_quantity', 10);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
  */

  // Mock data for now
  return {
    products: [
      {
        id: 'PROD-001',
        name: 'Product A',
        stockQuantity: 45,
        reorderLevel: 20,
        status: 'In Stock',
      },
      {
        id: 'PROD-002',
        name: 'Product B',
        stockQuantity: 5,
        reorderLevel: 20,
        status: 'Low Stock',
      },
    ],
    totalProducts: 2,
    lowStockCount: 1,
  };
}
```

#### Step 4: Update the System Prompt

Edit [lib/elite-agent-with-mcp.ts:11-43](lib/elite-agent-with-mcp.ts#L11-L43) to tell the AI about the new tool:

```typescript
const SYSTEM_PROMPT_WITH_MCP = `You are an elite Data Analysis AI Agent...

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

4. **get_product_inventory** - Get product inventory levels (NEW!)
   - Args: productId (optional), lowStockOnly (boolean)
   - Returns: product list with stock levels

...rest of prompt...
`;
```

#### Step 5: Test the New Tool

```bash
# Inspect to verify it's registered
npx ts-node inspect-mcp-tools.ts

# Test it directly
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_product_inventory",
    "args": {
      "lowStockOnly": true
    }
  }'

# Test with AI
curl -X POST http://localhost:3000/api/chat-mcp \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me products with low stock"
  }'
```

## More Tool Examples

### Example 1: Get Top Customers

```typescript
// In TOOLS array:
{
  name: 'get_top_customers',
  description: 'Get top customers by revenue or order count',
  inputSchema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['revenue', 'orders', 'frequency'],
        description: 'Metric to rank by',
      },
      limit: {
        type: 'number',
        description: 'Number of customers to return (default: 10)',
      },
      period: {
        type: 'string',
        description: 'Time period (e.g., "2024-10" for October)',
      },
    },
    required: ['metric', 'period'],
  },
}

// Implementation:
async function getTopCustomers(args: {
  metric: 'revenue' | 'orders' | 'frequency';
  limit?: number;
  period: string;
}) {
  const limit = args.limit || 10;

  // Query database for top customers
  // Example:
  // const { data } = await supabase
  //   .from('customers')
  //   .select('*, orders(total)')
  //   .eq('created_at', args.period)
  //   .order(args.metric, { ascending: false })
  //   .limit(limit);

  return {
    topCustomers: [
      { id: 'CUST-001', name: 'Ahmad', totalRevenue: 15000 },
      { id: 'CUST-002', name: 'Fatima', totalRevenue: 12000 },
    ],
    metric: args.metric,
    period: args.period,
  };
}
```

### Example 2: Send Email Notification

```typescript
// In TOOLS array:
{
  name: 'send_alert_email',
  description: 'Send email alert to admin',
  inputSchema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'Email subject',
      },
      message: {
        type: 'string',
        description: 'Email message body',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        description: 'Alert priority level',
      },
    },
    required: ['subject', 'message'],
  },
}

// Implementation:
async function sendAlertEmail(args: {
  subject: string;
  message: string;
  priority?: string;
}) {
  // Use your email service (SendGrid, Resend, etc.)
  // Example:
  // await sendEmail({
  //   to: process.env.ADMIN_EMAIL,
  //   subject: `[${args.priority?.toUpperCase() || 'MEDIUM'}] ${args.subject}`,
  //   body: args.message,
  // });

  return {
    sent: true,
    timestamp: new Date().toISOString(),
    recipient: process.env.ADMIN_EMAIL,
  };
}
```

### Example 3: Generate Report

```typescript
// In TOOLS array:
{
  name: 'generate_report',
  description: 'Generate a business report in PDF format',
  inputSchema: {
    type: 'object',
    properties: {
      reportType: {
        type: 'string',
        enum: ['sales', 'inventory', 'customers', 'financial'],
        description: 'Type of report to generate',
      },
      startDate: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date (YYYY-MM-DD)',
      },
      format: {
        type: 'string',
        enum: ['pdf', 'excel', 'csv'],
        description: 'Output format',
      },
    },
    required: ['reportType', 'startDate', 'endDate'],
  },
}

// Implementation:
async function generateReport(args: {
  reportType: string;
  startDate: string;
  endDate: string;
  format?: string;
}) {
  // Generate report using jsPDF or similar
  // Query data from database
  // Format into report
  // Save to file storage

  return {
    reportUrl: `https://mshdata.com/reports/${args.reportType}-${Date.now()}.${args.format || 'pdf'}`,
    generatedAt: new Date().toISOString(),
    reportType: args.reportType,
  };
}
```

## Tool Best Practices

### 1. Clear Descriptions
```typescript
// Good
description: 'Retrieve sales data from database for a specific date range'

// Bad
description: 'Get sales'
```

### 2. Validate Inputs
```typescript
async function getSalesData(args: { startDate: string; endDate: string }) {
  // Validate dates
  if (!args.startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error('Invalid startDate format. Use YYYY-MM-DD');
  }

  // Check date range is valid
  const start = new Date(args.startDate);
  const end = new Date(args.endDate);

  if (start > end) {
    throw new Error('startDate cannot be after endDate');
  }

  // Continue with logic...
}
```

### 3. Return Structured Data
```typescript
// Good - Structured with metadata
return {
  data: [...],
  metadata: {
    count: 10,
    startDate: args.startDate,
    endDate: args.endDate,
  },
};

// Bad - Raw data without context
return [...];
```

### 4. Handle Errors Gracefully
```typescript
async function getCustomerData(args: { customerId: string }) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', args.customerId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        found: false,
        message: `Customer ${args.customerId} not found`,
      };
    }

    return {
      found: true,
      customer: data,
    };

  } catch (error: any) {
    return {
      error: true,
      message: error.message,
    };
  }
}
```

## Using External MCP Servers

You can also connect to external MCP servers built by others:

### Popular MCP Servers:
- **Filesystem MCP** - Read/write files
- **GitHub MCP** - Interact with GitHub API
- **Google Drive MCP** - Access Google Drive
- **Slack MCP** - Send Slack messages
- **Database MCP** - Direct database access

### How to Add External MCP Server:

1. Install the MCP server package:
```bash
npm install @modelcontextprotocol/server-filesystem
```

2. Connect to it in your client:
```typescript
// Create a new client for external server
const externalClient = new MCPClient();
await externalClient.connect({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files'],
});
```

3. List its tools:
```typescript
const tools = await externalClient.listTools();
console.log('External tools:', tools);
```

## File Structure

When adding tools, you only need to edit 2 files:

```
lib/
├── mcp-server.ts           ← Add tool definition and implementation
└── elite-agent-with-mcp.ts ← Update system prompt to tell AI about tool
```

## Testing Your Tools

Always test new tools:

```bash
# 1. Inspect the tool
npx ts-node inspect-mcp-tools.ts

# 2. Run the full test suite
npx ts-node test-mcp.ts

# 3. Test directly via API
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"your_tool_name","args":{...}}'

# 4. Test with AI
curl -X POST http://localhost:3000/api/chat-mcp \
  -H "Content-Type: application/json" \
  -d '{"message":"Use my new tool"}'
```

## Summary

1. **Tools are custom functions** you create, not packages you install
2. **Add tools** in [lib/mcp-server.ts](lib/mcp-server.ts)
3. **Inspect tools** with `npx ts-node inspect-mcp-tools.ts`
4. **Test tools** before deploying
5. **Update AI prompt** so AI knows about new tools

## Need Help?

- Read the full guide: [MCP_USAGE_GUIDE.md](MCP_USAGE_GUIDE.md)
- Check examples in: [lib/mcp-server.ts:47-120](lib/mcp-server.ts#L47-L120)
- Official MCP docs: https://modelcontextprotocol.io

---

Built by Msh (hi@msh.sa)
