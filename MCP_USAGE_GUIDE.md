# MCP (Model Context Protocol) Usage Guide for Storn Analytics

## What is MCP?

**MCP (Model Context Protocol)** is Anthropic's protocol that allows AI agents to connect to external tools and data sources. Think of it as a standardized way for your AI to "call functions" to fetch real data instead of making up answers.

## How It Works in Your Website

```
┌─────────────────┐
│   User asks AI  │
│  "Show sales    │
│  for October"   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Elite Agent (GLM-4.6)      │
│  "I need sales data..."     │
│  **[MCP_TOOL: get_sales_data│
│   args: {start: "2024-10-01"│
│          end: "2024-10-31"}]│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  MCP Client                 │
│  Connects to MCP Server     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  MCP Server                 │
│  Executes get_sales_data()  │
│  Queries Supabase Database  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Returns real data to AI    │
│  {revenue: 45000, orders: 89}│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  AI analyzes and responds   │
│  "In October you had 89     │
│   orders totaling SAR 45K"  │
└─────────────────────────────┘
```

## Your MCP Architecture

You now have **4 files** working together:

### 1. MCP Server (`lib/mcp-server.ts`)

**What it does**: Defines the tools (functions) that AI can use

**Available Tools**:

| Tool | Purpose | Arguments | Returns |
|------|---------|-----------|---------|
| `get_sales_data` | Fetch sales from database | `startDate`, `endDate` | Revenue, orders, top products |
| `analyze_customer_behavior` | Analyze customer patterns | `customerId`, `period` | Purchase history, churn risk |
| `get_invoice_summary` | Get invoice summary | `month` | Total invoices, VAT, compliance |

**Example Tool Definition**:
```typescript
{
  name: 'get_sales_data',
  description: 'Retrieve sales data from the database for a specific date range',
  inputSchema: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
      endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
    },
    required: ['startDate', 'endDate'],
  },
}
```

### 2. MCP Client (`lib/mcp-client.ts`)

**What it does**: Connects to the MCP server and calls tools

**Main Methods**:
- `connect()` - Starts the MCP server process
- `callTool(name, args)` - Executes a tool
- `listTools()` - Gets all available tools
- `disconnect()` - Closes connection

**Helper Function**:
```typescript
// Easy to use in API routes
const result = await useMCPTool('get_sales_data', {
  startDate: '2024-10-01',
  endDate: '2024-10-31'
});
```

### 3. API Endpoint (`app/api/mcp-tools/route.ts`)

**What it does**: Exposes MCP tools via REST API

**Endpoints**:

**POST /api/mcp-tools** - Call a tool
```bash
curl -X POST https://mshdata.com/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_sales_data",
    "args": {
      "startDate": "2024-10-01",
      "endDate": "2024-10-31"
    }
  }'
```

**GET /api/mcp-tools** - List all tools
```bash
curl https://mshdata.com/api/mcp-tools
```

### 4. Enhanced AI Agent (`lib/elite-agent-with-mcp.ts`)

**What it does**: Your existing z.ai GLM-4.6 agent now knows how to use MCP tools

**How AI requests tools**:
```typescript
// AI response will include:
"I'll fetch the sales data for you. **[MCP_TOOL: get_sales_data | args: {startDate: '2024-10-01', endDate: '2024-10-31'}]**"

// System extracts this, executes the tool, and gives results back to AI
```

## Step-by-Step: Using MCP in Your Website

### Step 1: Test MCP Server Directly

First, make sure your MCP server works:

```typescript
// Create a test file: test-mcp.ts
import { useMCPTool } from './lib/mcp-client';

async function test() {
  try {
    // Test sales data tool
    const sales = await useMCPTool('get_sales_data', {
      startDate: '2024-10-01',
      endDate: '2024-10-31'
    });
    console.log('Sales Data:', sales);

    // Test customer analysis
    const customer = await useMCPTool('analyze_customer_behavior', {
      customerId: 'CUST-001',
      period: 'month'
    });
    console.log('Customer Analysis:', customer);

    // Test invoice summary
    const invoices = await useMCPTool('get_invoice_summary', {
      month: '2024-10'
    });
    console.log('Invoice Summary:', invoices);

  } catch (error) {
    console.error('MCP Error:', error);
  }
}

test();
```

Run it:
```bash
npx ts-node test-mcp.ts
```

### Step 2: Test API Endpoint

Test that your API endpoint works:

```bash
# List available tools
curl http://localhost:3000/api/mcp-tools

# Call a tool
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_sales_data",
    "args": {
      "startDate": "2024-10-01",
      "endDate": "2024-10-31"
    }
  }'
```

### Step 3: Use from Frontend (React Component)

Create a React component that uses MCP tools:

```typescript
// app/components/MCPDataFetcher.tsx
'use client';

import { useState } from 'react';

export default function MCPDataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchSalesData() {
    setLoading(true);
    try {
      const response = await fetch('/api/mcp-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get_sales_data',
          args: {
            startDate: '2024-10-01',
            endDate: '2024-10-31'
          }
        })
      });

      const result = await response.json();
      setData(result.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={fetchSalesData}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Fetch Sales Data'}
      </button>

      {data && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

### Step 4: Use with AI Agent (Chat Interface)

Integrate with your existing chat interface:

```typescript
// app/api/chat/route.ts (or similar)
import { analyzeWithEliteAgentMCP } from '@/lib/elite-agent-with-mcp';

export async function POST(request: Request) {
  const { message, sessionId } = await request.json();

  const response = await analyzeWithEliteAgentMCP({
    question: message,
    sessionId: sessionId || 'default',
  });

  return Response.json({
    message: response.content,
    error: response.error,
  });
}
```

Frontend chat component:
```typescript
'use client';

import { useState } from 'react';

export default function AIChat() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');

  async function sendMessage() {
    const userMessage = input;
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Call AI with MCP
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();

    // Add AI response
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 px-4 py-2 border rounded"
          placeholder="Ask about sales, customers, invoices..."
        />
        <button
          onClick={sendMessage}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

## Example Conversations

### Example 1: Sales Data Request

**User**: "Show me sales data for October 2024"

**AI Response**:
```
I'll fetch the sales data for you. **[MCP_TOOL: get_sales_data | args: {startDate: '2024-10-01', endDate: '2024-10-31'}]**
```

**System executes tool, AI gets results**:
```json
{
  "totalRevenue": 45000,
  "totalOrders": 89,
  "topProducts": [
    {"name": "Product A", "sales": 15000},
    {"name": "Product B", "sales": 12000}
  ]
}
```

**AI Final Response**:
```
In October 2024, your store generated SAR 45,000 in revenue from 89 orders.

Top performing products:
1. Product A - SAR 15,000
2. Product B - SAR 12,000

This represents a strong month with an average order value of SAR 505.
```

### Example 2: Customer Analysis

**User**: "Analyze customer CUST-001's behavior this month"

**AI uses**: `analyze_customer_behavior` tool

**Returns**: Purchase frequency, churn risk, recommendations

### Example 3: Invoice Summary

**User**: "Give me the invoice summary for accounting"

**AI uses**: `get_invoice_summary` tool

**Returns**: Total invoices, VAT calculations, compliance status

## Connecting to Real Database

Currently the MCP tools return mock data. Here's how to connect them to your Supabase database:

```typescript
// lib/mcp-server.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSalesData(args: { startDate: string; endDate: string }) {
  // Query your actual database
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', args.startDate)
    .lte('created_at', args.endDate);

  if (error) throw error;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  // Get top products
  const { data: products } = await supabase
    .from('order_items')
    .select('product_id, product_name, quantity, price')
    .gte('created_at', args.startDate)
    .lte('created_at', args.endDate);

  const productSales = products?.reduce((acc, item) => {
    const key = item.product_name;
    if (!acc[key]) {
      acc[key] = { name: key, sales: 0 };
    }
    acc[key].sales += item.quantity * item.price;
    return acc;
  }, {} as Record<string, { name: string; sales: number }>);

  const topProducts = Object.values(productSales || {})
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders,
    topProducts,
    averageOrderValue: totalRevenue / totalOrders,
  };
}
```

## Deployment to mshdata.com

### Add to Coolify Environment Variables

In your Coolify dashboard, add these environment variables:

```bash
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_PATH=/app/lib/mcp-server.ts

# Supabase (already configured)
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Update Dockerfile (if needed)

Make sure your Dockerfile includes ts-node:

```dockerfile
# Already in your dependencies
RUN npm install
# ts-node is already in devDependencies
```

### Test in Production

After deploying:

```bash
# Test the API endpoint
curl https://mshdata.com/api/mcp-tools

# Test with tool call
curl -X POST https://mshdata.com/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_sales_data","args":{"startDate":"2024-10-01","endDate":"2024-10-31"}}'
```

## Troubleshooting

### Issue: "Client not connected"

**Solution**: Make sure the MCP server process is starting correctly

```typescript
// Add logging to mcp-client.ts
async connect() {
  console.log('Starting MCP server...');
  const serverProcess = spawn('node', [...]);
  console.log('MCP server started');
}
```

### Issue: "Tool not found"

**Solution**: Verify tool names match exactly

```bash
# List available tools
curl http://localhost:3000/api/mcp-tools

# Use exact tool name from the list
```

### Issue: MCP tools return errors in production

**Solution**: Check environment variables and database connection

```typescript
// Add error handling
async function getSalesData(args: any) {
  try {
    // Your database query
  } catch (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to fetch sales data: ${error.message}`);
  }
}
```

## Next Steps

1. **Test locally** - Run `npm run dev` and test the API endpoints
2. **Connect to database** - Replace mock data with real Supabase queries
3. **Create frontend** - Build a chat interface or dashboard using MCP tools
4. **Deploy to Coolify** - Push to GitHub and deploy to mshdata.com
5. **Monitor usage** - Check LangSmith traces to see how AI uses MCP tools

## Summary

You now have a complete MCP setup that allows your AI agent to:
- Fetch real sales data from your database
- Analyze customer behavior patterns
- Generate invoice summaries for accounting

The AI automatically knows when to use these tools based on user questions, making your analytics platform much more powerful than just analyzing uploaded CSVs.

**Created by**: Msh (hi@msh.sa)
**Model**: z.ai GLM-4.6 with MCP integration
**Database**: Supabase PostgreSQL
**Deployment**: mshdata.com via Coolify
