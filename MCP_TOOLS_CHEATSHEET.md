# MCP Tools Cheatsheet

Quick reference for your MCP tools setup.

## View All Tools

```bash
npx ts-node inspect-mcp-tools.ts
```

## Current Tools (3)

### 1. get_sales_data
**What it does**: Fetches sales data from database

**Parameters**:
- `startDate` (required) - Format: "2024-10-01"
- `endDate` (required) - Format: "2024-10-31"

**Example**:
```bash
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_sales_data",
    "args": {"startDate": "2024-10-01", "endDate": "2024-10-31"}
  }'
```

**AI Usage**: "Show me sales for October 2024"

---

### 2. analyze_customer_behavior
**What it does**: Analyzes customer purchase patterns

**Parameters**:
- `customerId` (required) - Example: "CUST-001"
- `period` (required) - Options: "week", "month", "quarter", "year"

**Example**:
```bash
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze_customer_behavior",
    "args": {"customerId": "CUST-001", "period": "month"}
  }'
```

**AI Usage**: "Analyze customer CUST-001's behavior"

---

### 3. get_invoice_summary
**What it does**: Gets invoice summary for accounting

**Parameters**:
- `month` (required) - Format: "2024-10"

**Example**:
```bash
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_invoice_summary",
    "args": {"month": "2024-10"}
  }'
```

**AI Usage**: "Give me invoice summary for October"

---

## Add New Tool (Quick)

Edit [lib/mcp-server.ts](lib/mcp-server.ts):

```typescript
// 1. Add to TOOLS array (line ~15)
{
  name: 'your_tool_name',
  description: 'What it does',
  inputSchema: {
    type: 'object',
    properties: {
      paramName: {
        type: 'string',
        description: 'What this parameter is',
      },
    },
    required: ['paramName'],
  },
}

// 2. Add to handleToolCall switch (line ~90)
case 'your_tool_name':
  return await yourToolFunction(args);

// 3. Create the function (line ~120)
async function yourToolFunction(args: { paramName: string }) {
  // Your logic here
  return { result: 'data' };
}
```

## Test Tools

```bash
# Test all tools
npx ts-node test-mcp.ts

# Test specific tool
curl -X POST http://localhost:3000/api/mcp-tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"tool_name","args":{...}}'
```

## Files Reference

| File | Purpose |
|------|---------|
| [lib/mcp-server.ts](lib/mcp-server.ts) | Define and implement tools |
| [lib/mcp-client.ts](lib/mcp-client.ts) | Connect to MCP server |
| [lib/elite-agent-with-mcp.ts](lib/elite-agent-with-mcp.ts) | AI agent that uses tools |
| [inspect-mcp-tools.ts](inspect-mcp-tools.ts) | View all tools |
| [test-mcp.ts](test-mcp.ts) | Test suite |

## Documentation

- **Complete Guide**: [MCP_USAGE_GUIDE.md](MCP_USAGE_GUIDE.md)
- **How to Add Tools**: [HOW_TO_ADD_MCP_TOOLS.md](HOW_TO_ADD_MCP_TOOLS.md)
- **Quick Start**: [MCP_QUICK_START.md](MCP_QUICK_START.md)

---

Built by Msh (hi@msh.sa)
