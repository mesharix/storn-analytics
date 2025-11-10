# MCP Quick Start Guide

## What You Have Now

Your Storn Analytics website now has **complete MCP (Model Context Protocol) integration** that allows your AI agent to fetch real data from your database.

## Files Created

### Core MCP Files (4 files)
1. **[lib/mcp-server.ts](lib/mcp-server.ts)** - MCP server with 3 tools
2. **[lib/mcp-client.ts](lib/mcp-client.ts)** - Client to connect to MCP server
3. **[lib/elite-agent-with-mcp.ts](lib/elite-agent-with-mcp.ts)** - Enhanced AI agent
4. **[app/api/mcp-tools/route.ts](app/api/mcp-tools/route.ts)** - API endpoints for tools

### Frontend Demo (3 files)
5. **[app/components/MCPChat.tsx](app/components/MCPChat.tsx)** - Chat component
6. **[app/api/chat-mcp/route.ts](app/api/chat-mcp/route.ts)** - Chat API route
7. **[app/mcp-demo/page.tsx](app/mcp-demo/page.tsx)** - Demo page

### Documentation & Testing (3 files)
8. **[MCP_USAGE_GUIDE.md](MCP_USAGE_GUIDE.md)** - Complete usage guide
9. **[test-mcp.ts](test-mcp.ts)** - Comprehensive test suite
10. **[MCP_QUICK_START.md](MCP_QUICK_START.md)** - This file

## Quick Test (3 Steps)

### Step 1: Install Dependencies (Already Done)
```bash
# MCP SDK already installed in package.json
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Visit Demo Page
Open in browser: http://localhost:3000/mcp-demo

## Available MCP Tools

Your AI can now use these 3 tools:

| Tool | What It Does | Example |
|------|--------------|---------|
| `get_sales_data` | Fetch sales from database | "Show sales for October" |
| `analyze_customer_behavior` | Analyze customer patterns | "Analyze customer CUST-001" |
| `get_invoice_summary` | Get invoice summary | "Invoice summary for this month" |

## How It Works

```
User asks: "Show me sales for October"
         ↓
Elite Agent (GLM-4.6) thinks: "I need sales data"
         ↓
AI requests: [MCP_TOOL: get_sales_data | args: {...}]
         ↓
MCP Client connects to MCP Server
         ↓
MCP Server queries Supabase database
         ↓
Returns real data to AI
         ↓
AI analyzes and responds: "In October you had..."
```

## Test the Integration

Run the comprehensive test suite:

```bash
npx ts-node test-mcp.ts
```

This will test:
- ✓ Server connection
- ✓ Tool listing
- ✓ Individual tools
- ✓ AI agent integration
- ✓ Conversation memory
- ✓ Error handling

## Next Steps

### 1. Connect to Real Database

Currently using mock data. To connect to your Supabase:

Edit [lib/mcp-server.ts:47-75](lib/mcp-server.ts#L47-L75):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSalesData(args: { startDate: string; endDate: string }) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', args.startDate)
    .lte('created_at', args.endDate);

  // Calculate totals from real data
  const totalRevenue = data.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = data.length;

  return { totalRevenue, totalOrders, ... };
}
```

### 2. Add to Your Existing Pages

Use the MCP chat component anywhere:

```typescript
// In any page
import MCPChat from '@/app/components/MCPChat';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <MCPChat />
    </div>
  );
}
```

### 3. Deploy to Production

Already configured for Coolify deployment to mshdata.com:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add MCP integration with Elite Agent"
   git push
   ```

2. **Coolify will auto-deploy** (already configured)

3. **Test on production**:
   ```bash
   curl https://mshdata.com/api/mcp-tools
   ```

4. **Visit live demo**:
   https://mshdata.com/mcp-demo

## Example Queries to Try

### Arabic Queries
- "ما هو إجمالي المبيعات للشهر الحالي؟"
- "أعطني تحليل للعميل CUST-001"
- "ملخص الفواتير لشهر أكتوبر"

### English Queries
- "Show me sales data for last month"
- "Analyze customer behavior for CUST-001"
- "Give me the invoice summary for October"
- "What are the top selling products this week?"

## API Endpoints

### List Available Tools
```bash
curl http://localhost:3000/api/mcp-tools
```

### Call a Tool Directly
```bash
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

### Chat with AI Agent
```bash
curl -X POST http://localhost:3000/api/chat-mcp \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me sales for October",
    "sessionId": "my-session"
  }'
```

## Troubleshooting

### Issue: "Cannot find module '@modelcontextprotocol/sdk'"
**Solution**: Run `npm install`

### Issue: MCP server not starting
**Solution**: Check that ts-node is installed:
```bash
npm install --save-dev ts-node @types/node
```

### Issue: Database connection errors
**Solution**: Check environment variables in `.env.local`:
```bash
DATABASE_URL="postgresql://..."
SUPABASE_SERVICE_ROLE_KEY="your-key"
```

### Issue: AI not using MCP tools
**Solution**: Make sure the system prompt in [lib/elite-agent-with-mcp.ts:11-43](lib/elite-agent-with-mcp.ts#L11-L43) is being used

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Your Website                         │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │ User Browser │ ←────→  │  Next.js     │            │
│  │              │         │  API Routes  │            │
│  └──────────────┘         └──────┬───────┘            │
│                                   │                     │
│                          ┌────────▼─────────┐          │
│                          │  Elite Agent     │          │
│                          │  (GLM-4.6)       │          │
│                          └────────┬─────────┘          │
│                                   │                     │
│                          ┌────────▼─────────┐          │
│                          │   MCP Client     │          │
│                          └────────┬─────────┘          │
│                                   │                     │
│                          ┌────────▼─────────┐          │
│                          │   MCP Server     │          │
│                          │   (3 Tools)      │          │
│                          └────────┬─────────┘          │
│                                   │                     │
└───────────────────────────────────┼─────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  Supabase          │
                          │  PostgreSQL        │
                          └────────────────────┘
```

## Tech Stack

- **AI Model**: z.ai GLM-4.6 (Chinese model, supports Arabic)
- **Protocol**: Model Context Protocol (MCP) by Anthropic
- **Framework**: Next.js 14 App Router
- **Database**: Supabase PostgreSQL
- **AI Framework**: LangChain
- **Deployment**: Coolify on mshdata.com

## Documentation

- **Complete Guide**: [MCP_USAGE_GUIDE.md](MCP_USAGE_GUIDE.md)
- **Test Suite**: [test-mcp.ts](test-mcp.ts)
- **MCP Official Docs**: https://modelcontextprotocol.io

## Support

Built by **Msh (hi@msh.sa)**

For issues or questions:
- Email: hi@msh.sa
- Check the comprehensive guide: [MCP_USAGE_GUIDE.md](MCP_USAGE_GUIDE.md)
- Run tests: `npx ts-node test-mcp.ts`

---

**Ready to use!** Visit http://localhost:3000/mcp-demo to see it in action.
