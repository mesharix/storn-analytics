# Complete Guide: Creating Custom AI Agents with LangChain

This guide shows you **exactly** how to use LangChain to build your own AI agents from scratch.

## Table of Contents
1. [Basic Agent (Simplest)](#basic-agent-simplest)
2. [Agent with Tools/Functions](#agent-with-tools-functions)
3. [Agent with Memory](#agent-with-memory)
4. [Multi-Agent System](#multi-agent-system)
5. [Real-World Examples](#real-world-examples)

---

## Basic Agent (Simplest)

### Step 1: Create Your First Agent

```typescript
// lib/my-first-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function myFirstAgent(userInput: string) {
  // 1. Initialize the AI model
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.7,
    maxTokens: 1000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  // 2. Define the agent's personality
  const systemPrompt = `You are a helpful assistant that answers questions clearly and concisely.`;

  // 3. Create the conversation
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userInput),
  ];

  // 4. Get the response
  const response = await model.invoke(messages);

  // 5. Return the result
  return response.content as string;
}
```

### Step 2: Test It

```bash
# Create a test script
node -e "
const { myFirstAgent } = require('./lib/my-first-agent.ts');
myFirstAgent('What is 2+2?').then(console.log);
"
```

---

## Agent with Tools/Functions

This is where LangChain gets powerful - your agent can call functions!

### Example: Weather Agent with Tools

```typescript
// lib/weather-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// Define your tools/functions
const tools = {
  getCurrentWeather: async (location: string) => {
    // In real app, call weather API
    console.log(`🌤️ Getting weather for ${location}...`);
    return {
      location,
      temperature: 72,
      condition: 'Sunny',
      humidity: 65,
    };
  },

  getWeatherForecast: async (location: string, days: number) => {
    console.log(`📅 Getting ${days}-day forecast for ${location}...`);
    return {
      location,
      forecast: [
        { day: 'Monday', temp: 75, condition: 'Partly Cloudy' },
        { day: 'Tuesday', temp: 70, condition: 'Rainy' },
      ],
    };
  },
};

export async function weatherAgent(userQuery: string) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.3, // Lower temp for more precise tool calling
    maxTokens: 1500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  // System prompt that explains available tools
  const systemPrompt = `You are a weather assistant. You have access to these tools:

1. getCurrentWeather(location: string) - Get current weather for a location
2. getWeatherForecast(location: string, days: number) - Get weather forecast

When the user asks about weather, decide which tool to use and respond with:
TOOL: toolName(arguments)

Then I'll execute it and give you the result. After that, give a natural response to the user.

Examples:
- User: "What's the weather in Paris?" → You: "TOOL: getCurrentWeather('Paris')"
- User: "5-day forecast for Tokyo?" → You: "TOOL: getWeatherForecast('Tokyo', 5)"
`;

  let messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userQuery),
  ];

  // First AI call - decide which tool to use
  let response = await model.invoke(messages);
  let aiResponse = response.content as string;

  console.log('AI Decision:', aiResponse);

  // Check if AI wants to use a tool
  if (aiResponse.includes('TOOL:')) {
    // Parse the tool call (simple parsing - in production use structured output)
    const toolMatch = aiResponse.match(/TOOL:\s*(\w+)\((.*?)\)/);

    if (toolMatch) {
      const toolName = toolMatch[1];
      const argsString = toolMatch[2];

      // Execute the tool
      let toolResult;
      if (toolName === 'getCurrentWeather') {
        const location = argsString.replace(/['"]/g, '');
        toolResult = await tools.getCurrentWeather(location);
      } else if (toolName === 'getWeatherForecast') {
        const [location, days] = argsString.split(',').map(s => s.trim().replace(/['"]/g, ''));
        toolResult = await tools.getWeatherForecast(location, parseInt(days));
      }

      // Add tool result to conversation
      messages.push(new AIMessage(aiResponse));
      messages.push(new HumanMessage(`Tool result: ${JSON.stringify(toolResult, null, 2)}`));

      // Second AI call - generate natural response using tool result
      response = await model.invoke(messages);
      aiResponse = response.content as string;
    }
  }

  return aiResponse;
}
```

### Test the Weather Agent

```typescript
// app/api/weather-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { weatherAgent } from '@/lib/weather-agent';

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const result = await weatherAgent(query);
  return NextResponse.json({ result });
}
```

---

## Agent with Memory

Make your agent remember previous conversations!

### Example: Personal Assistant with Memory

```typescript
// lib/assistant-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// Store conversations (use Redis in production!)
const conversations = new Map<string, BaseMessage[]>();

export async function assistantAgent(userInput: string, userId: string = 'default') {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.7,
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  // Get or create conversation history
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  const history = conversations.get(userId)!;

  const systemPrompt = `You are a helpful personal assistant.

Remember previous conversations and use that context to give better responses.

Your personality:
- Friendly and professional
- Remember user preferences
- Proactive with suggestions
- Concise but thorough
`;

  // Build messages with history
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...history, // Include all previous messages
    new HumanMessage(userInput),
  ];

  // Get AI response
  const response = await model.invoke(messages);
  const aiResponse = response.content as string;

  // Save to history
  history.push(new HumanMessage(userInput));
  history.push(new AIMessage(aiResponse));

  // Keep only last 20 messages (10 exchanges)
  if (history.length > 20) {
    conversations.set(userId, history.slice(-20));
  }

  return {
    response: aiResponse,
    conversationLength: history.length,
  };
}

// Clear memory for a user
export function clearMemory(userId: string) {
  conversations.delete(userId);
}
```

### Test Conversation Memory

```bash
curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "message": "My name is John"}'

# Response: "Nice to meet you, John! ..."

curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "message": "What is my name?"}'

# Response: "Your name is John!"
```

---

## Multi-Agent System

Create specialized agents that work together!

### Example: Customer Service Multi-Agent

```typescript
// lib/customer-service-agents.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

function createModel() {
  return new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.5,
    maxTokens: 1500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });
}

// Agent 1: Router - Decides which specialist to use
export async function routerAgent(customerQuery: string) {
  const model = createModel();

  const systemPrompt = `You are a routing agent. Analyze the customer query and decide which specialist should handle it.

Available specialists:
- BILLING: Payment issues, invoices, refunds, pricing questions
- TECHNICAL: Product not working, bugs, errors, setup help
- SALES: Product recommendations, features, upgrades, trials
- GENERAL: Account info, shipping, returns, general questions

Respond with ONLY the specialist name (BILLING, TECHNICAL, SALES, or GENERAL).`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Customer query: "${customerQuery}"`),
  ];

  const response = await model.invoke(messages);
  const specialist = (response.content as string).trim().toUpperCase();

  console.log(`🔀 Router: Sending to ${specialist} specialist`);
  return specialist;
}

// Agent 2: Billing Specialist
export async function billingAgent(customerQuery: string) {
  const model = createModel();

  const systemPrompt = `You are a billing specialist. Help customers with:
- Payment issues
- Invoices and receipts
- Refunds and credits
- Pricing questions
- Subscription management

Be empathetic, clear, and solution-focused.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(customerQuery),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Agent 3: Technical Specialist
export async function technicalAgent(customerQuery: string) {
  const model = createModel();

  const systemPrompt = `You are a technical support specialist. Help customers with:
- Troubleshooting issues
- Bug reports
- Setup and configuration
- Error messages
- How-to questions

Be clear, step-by-step, and patient. Ask clarifying questions if needed.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(customerQuery),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Agent 4: Sales Specialist
export async function salesAgent(customerQuery: string) {
  const model = createModel();

  const systemPrompt = `You are a sales specialist. Help customers with:
- Product recommendations
- Feature explanations
- Upgrade options
- Trial questions
- Pricing comparisons

Be helpful, enthusiastic, but never pushy.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(customerQuery),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Agent 5: General Support
export async function generalAgent(customerQuery: string) {
  const model = createModel();

  const systemPrompt = `You are a general support specialist. Handle:
- Account questions
- Shipping and delivery
- Returns and exchanges
- General information

Be friendly and helpful.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(customerQuery),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Master function: Routes to appropriate specialist
export async function customerServiceAgent(customerQuery: string) {
  // Step 1: Route the query
  const specialist = await routerAgent(customerQuery);

  // Step 2: Call the appropriate specialist
  let response: string;

  switch (specialist) {
    case 'BILLING':
      response = await billingAgent(customerQuery);
      break;
    case 'TECHNICAL':
      response = await technicalAgent(customerQuery);
      break;
    case 'SALES':
      response = await salesAgent(customerQuery);
      break;
    case 'GENERAL':
    default:
      response = await generalAgent(customerQuery);
      break;
  }

  return {
    specialist,
    response,
  };
}
```

### API for Multi-Agent System

```typescript
// app/api/customer-service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { customerServiceAgent } from '@/lib/customer-service-agents';

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  const result = await customerServiceAgent(query);

  return NextResponse.json({
    specialist: result.specialist,
    response: result.response,
  });
}
```

### Test Multi-Agent System

```bash
# Billing query
curl -X POST http://localhost:3000/api/customer-service \
  -H "Content-Type: application/json" \
  -d '{"query": "I was charged twice for my subscription"}'

# Technical query
curl -X POST http://localhost:3000/api/customer-service \
  -H "Content-Type: application/json" \
  -d '{"query": "The app crashes when I click login"}'

# Sales query
curl -X POST http://localhost:3000/api/customer-service \
  -H "Content-Type: application/json" \
  -d '{"query": "What features are in the Pro plan?"}'
```

---

## Real-World Examples

### 1. Database Query Agent

Converts natural language to SQL queries!

```typescript
// lib/sql-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function sqlAgent(question: string, schema: any) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.1, // Very low - need precise SQL
    maxTokens: 1000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const systemPrompt = `You are a SQL expert. Convert natural language questions to SQL queries.

Database Schema:
${JSON.stringify(schema, null, 2)}

Rules:
1. Generate ONLY the SQL query, no explanations
2. Use proper PostgreSQL syntax
3. Include appropriate WHERE clauses
4. Use JOINs when needed
5. Format for readability

Return ONLY the SQL query.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(question),
  ];

  const response = await model.invoke(messages);
  const sql = (response.content as string).replace(/```sql|```/g, '').trim();

  return sql;
}

// Usage
const schema = {
  tables: {
    users: ['id', 'name', 'email', 'created_at'],
    orders: ['id', 'user_id', 'total', 'status', 'created_at'],
    products: ['id', 'name', 'price', 'category'],
  },
};

const sql = await sqlAgent(
  'Show me all orders from users who joined in the last 30 days',
  schema
);
// Returns: SELECT o.* FROM orders o JOIN users u ON o.user_id = u.id WHERE u.created_at >= NOW() - INTERVAL '30 days';
```

### 2. Email Writing Agent

```typescript
// lib/email-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

interface EmailRequest {
  recipient: string;
  purpose: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  keyPoints: string[];
}

export async function emailAgent(request: EmailRequest) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.8,
    maxTokens: 1500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const systemPrompt = `You are an expert email writer.

Write a ${request.tone} email with:
- Clear subject line
- Proper greeting
- Well-structured body
- Appropriate closing
- Professional signature placeholder

Tone: ${request.tone}
Recipient: ${request.purpose}

Key points to include:
${request.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Write the email now.`),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Usage
const email = await emailAgent({
  recipient: 'potential client',
  purpose: 'follow up after meeting',
  tone: 'professional',
  keyPoints: [
    'Thank them for the meeting',
    'Recap the main discussion points',
    'Propose next steps',
    'Offer to answer questions',
  ],
});
```

### 3. Code Debugger Agent

```typescript
// lib/debugger-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export async function debuggerAgent(code: string, error: string, language: string) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.2,
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const systemPrompt = `You are an expert debugger for ${language}.

Analyze the code and error, then provide:
1. **Root Cause**: What's causing the error
2. **Fixed Code**: Corrected version
3. **Explanation**: Why the fix works
4. **Prevention**: How to avoid this in future

Be precise and actionable.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nError:\n${error}`),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}
```

---

## Key LangChain Concepts

### 1. Messages

```typescript
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// SystemMessage: Define agent behavior
new SystemMessage('You are a helpful assistant')

// HumanMessage: User input
new HumanMessage('What is the capital of France?')

// AIMessage: AI response (for conversation history)
new AIMessage('The capital of France is Paris.')
```

### 2. Temperature Control

```typescript
temperature: 0.0-0.3  // Focused, deterministic (good for: SQL, code, technical)
temperature: 0.4-0.7  // Balanced (good for: general chat, Q&A)
temperature: 0.8-1.0  // Creative (good for: writing, brainstorming)
```

### 3. Token Limits

```typescript
maxTokens: 500   // Short responses
maxTokens: 1500  // Medium responses
maxTokens: 3000  // Long responses
```

### 4. Streaming Responses

```typescript
const stream = await model.stream(messages);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

---

## Best Practices

1. ✅ **Clear System Prompts**: Be specific about role, capabilities, and behavior
2. ✅ **Low Temperature for Precision**: Use 0.1-0.3 for technical tasks
3. ✅ **High Temperature for Creativity**: Use 0.7-1.0 for content writing
4. ✅ **Limit Conversation History**: Keep last 10-20 messages max
5. ✅ **Structured Output**: Ask for JSON when you need structured data
6. ✅ **Error Handling**: Always wrap in try-catch
7. ✅ **Tool Validation**: Validate tool inputs before execution
8. ✅ **Memory Management**: Use Redis for production (not Map)
9. ✅ **Security**: Never expose API keys, validate all inputs
10. ✅ **Testing**: Test with edge cases and unexpected inputs

---

## Next Steps

1. Start with a basic agent (no tools, no memory)
2. Add conversation memory
3. Add 1-2 simple tools
4. Build multi-agent system
5. Deploy to production

Check out:
- **[HOW_TO_CREATE_AI_AGENTS.md](HOW_TO_CREATE_AI_AGENTS.md)** - More examples
- **[lib/custom-ai-agent.ts](lib/custom-ai-agent.ts)** - Working code
- **[lib/langchain-agent.ts](lib/langchain-agent.ts)** - Production example

Happy building! 🚀
