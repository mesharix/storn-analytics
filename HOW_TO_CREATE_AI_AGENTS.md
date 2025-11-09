# How to Create Your Own AI Agents

This guide shows you how to build custom AI agents for any purpose using the GLM-4.6 model.

## Quick Start Examples

### Example 1: Sales Assistant Agent

```typescript
const response = await fetch('/api/custom-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'sales',
    customerQuery: 'I need a laptop for video editing',
    productCatalog: [
      { name: 'Pro Laptop X1', price: 1999, specs: '32GB RAM, RTX 4080' },
      { name: 'Budget Laptop Y2', price: 899, specs: '16GB RAM, GTX 1650' },
    ],
    sessionId: 'customer-123',
  }),
});

const data = await response.json();
console.log(data.result.content); // AI recommendation
```

### Example 2: Code Review Agent

```typescript
const response = await fetch('/api/custom-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'code-review',
    code: `
      function getUserData(userId) {
        const data = db.query("SELECT * FROM users WHERE id = " + userId);
        return data;
      }
    `,
    language: 'javascript',
    focusAreas: ['security', 'best-practices'],
  }),
});

const data = await response.json();
console.log(data.result.content); // Security issues, suggestions
```

### Example 3: Content Writer Agent

```typescript
const response = await fetch('/api/custom-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'content-writer',
    topic: 'Benefits of Cloud Computing',
    contentType: 'blog',
    tone: 'professional',
    length: 'medium',
    keywords: ['cloud computing', 'scalability', 'cost savings'],
  }),
});

const data = await response.json();
console.log(data.result.content); // Generated blog post
console.log(data.result.metadata.wordCount); // Word count
```

### Example 4: Customer Support Agent

```typescript
const response = await fetch('/api/custom-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'support',
    ticketId: 'TICK-12345',
    customerName: 'John Doe',
    issue: 'My order #ORD-789 hasn\'t arrived yet, it\'s been 10 days',
    priority: 'high',
    category: 'shipping',
  }),
});

const data = await response.json();
console.log(data.result.content); // Support response
```

### Example 5: Orchestrator Agent (Routes to Specialist)

```typescript
const response = await fetch('/api/custom-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'orchestrator',
    userRequest: 'I need help integrating your payment API',
    availableAgents: ['sales', 'support', 'technical', 'billing'],
  }),
});

const data = await response.json();
console.log(data.result.selectedAgent); // 'technical'
```

## How to Create Your Own Custom Agent

### Step 1: Define Your Agent's Purpose

```typescript
// lib/my-custom-agent.ts
export interface MyAgentRequest {
  userInput: string;
  context?: any;
  sessionId?: string;
}
```

### Step 2: Create the Agent Function

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

export async function myCustomAgent(request: MyAgentRequest) {
  // 1. Initialize the model
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.7, // 0.0 = focused, 1.0 = creative
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  // 2. Define your agent's personality and capabilities
  const systemPrompt = `You are a [ROLE]. Your purpose is to [PURPOSE].

Your capabilities:
- [Capability 1]
- [Capability 2]
- [Capability 3]

Your personality:
- [Trait 1]
- [Trait 2]

${request.context ? `Context: ${JSON.stringify(request.context)}` : ''}

Always [BEHAVIOR].`;

  // 3. Build the conversation
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(request.userInput),
  ];

  // 4. Get AI response
  const response = await model.invoke(messages);

  // 5. Return the result
  return {
    content: response.content as string,
    metadata: {
      // Add any metadata you want
    },
  };
}
```

### Step 3: Add Conversation Memory (Optional)

```typescript
// Store conversation history
const conversations = new Map<string, BaseMessage[]>();

export async function myAgentWithMemory(request: MyAgentRequest) {
  const model = new ChatOpenAI({...});

  const sessionId = request.sessionId || 'default';
  const history = conversations.get(sessionId) || [];

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...history, // Include previous conversation
    new HumanMessage(request.userInput),
  ];

  const response = await model.invoke(messages);

  // Save to history
  history.push(new HumanMessage(request.userInput));
  history.push(new AIMessage(response.content as string));

  // Keep only last 10 messages
  if (history.length > 10) {
    conversations.set(sessionId, history.slice(-10));
  } else {
    conversations.set(sessionId, history);
  }

  return { content: response.content as string };
}
```

### Step 4: Add to API Route

```typescript
// app/api/custom-agent/route.ts
import { myCustomAgent } from '@/lib/my-custom-agent';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.agentType === 'my-custom') {
    const result = await myCustomAgent(body);
    return NextResponse.json({ success: true, result });
  }

  // ... other agents
}
```

## Key Configuration Parameters

### Temperature (Creativity)
- `0.0-0.3`: Focused, deterministic (good for: code review, data analysis, technical support)
- `0.4-0.7`: Balanced (good for: general chat, Q&A, recommendations)
- `0.8-1.0`: Creative, varied (good for: content writing, brainstorming, storytelling)

### Max Tokens (Response Length)
- `500`: Short responses (quick answers, confirmations)
- `1000-1500`: Medium responses (explanations, recommendations)
- `2000-4000`: Long responses (detailed analysis, long-form content)

### System Prompt Tips

1. **Be Specific**: Define exact role, capabilities, and constraints
2. **Set Tone**: Professional, casual, friendly, authoritative
3. **Provide Context**: Include relevant data, rules, or guidelines
4. **Define Output Format**: JSON, markdown, plain text, etc.
5. **Add Examples**: Show desired response format

## Advanced Features

### 1. Function Calling (Tools)

```typescript
const tools = {
  getCurrentWeather: async (location: string) => {
    // API call to weather service
    return { temp: 72, condition: 'Sunny' };
  },

  searchDatabase: async (query: string) => {
    // Database query
    return [...results];
  },
};

// In your agent, parse AI response for tool calls
// Then execute tools and feed results back to AI
```

### 2. Multi-Step Reasoning

```typescript
// Chain multiple AI calls for complex tasks
const step1 = await model.invoke([...]) // Analyze problem
const step2 = await model.invoke([...]) // Generate solution
const step3 = await model.invoke([...]) // Verify solution
```

### 3. Response Validation

```typescript
const response = await model.invoke(messages);
const content = response.content as string;

// Validate JSON response
try {
  const parsed = JSON.parse(content);
  return parsed;
} catch (error) {
  // Handle invalid response
}
```

### 4. Error Handling

```typescript
try {
  const response = await model.invoke(messages);
  return { content: response.content };
} catch (error: any) {
  console.error('Agent Error:', error);
  return {
    content: '',
    error: error.message,
    fallback: 'I apologize, but I encountered an issue...',
  };
}
```

## Common Use Cases

1. **Customer Service**: Answer FAQs, handle complaints, route tickets
2. **Sales**: Product recommendations, lead qualification, objection handling
3. **Content Creation**: Blog posts, social media, email campaigns, ad copy
4. **Code Assistance**: Code review, debugging, documentation, refactoring
5. **Data Analysis**: Insights, patterns, recommendations, predictions
6. **Education**: Tutoring, explanations, quiz generation, feedback
7. **Healthcare**: Symptom checker, health tips, appointment scheduling
8. **Finance**: Budget advice, expense tracking, investment insights
9. **HR**: Interview screening, onboarding, policy Q&A
10. **Legal**: Document review, contract analysis, legal research

## Testing Your Agent

```bash
# Test via curl
curl -X POST http://localhost:3000/api/custom-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "my-custom",
    "userInput": "Test message",
    "sessionId": "test-123"
  }'
```

## Best Practices

1. ✅ **Clear Purpose**: Each agent should have one clear purpose
2. ✅ **Specific Prompts**: More specific = better results
3. ✅ **Error Handling**: Always handle errors gracefully
4. ✅ **Memory Management**: Limit conversation history to prevent context overflow
5. ✅ **Testing**: Test with edge cases and unexpected inputs
6. ✅ **Monitoring**: Log agent interactions for debugging
7. ✅ **Security**: Validate inputs, sanitize outputs, protect API keys
8. ✅ **Performance**: Use appropriate temperature and token limits
9. ✅ **User Experience**: Provide loading states, handle timeouts
10. ✅ **Iteration**: Continuously improve based on user feedback

## Resources

- **GLM-4.6 Documentation**: https://api.z.ai/docs
- **LangChain Documentation**: https://js.langchain.com/docs
- **Example Agents**: See `/lib/custom-ai-agent.ts`
- **API Endpoint**: `/api/custom-agent`

## Need Help?

Check the example agents in:
- `/lib/custom-ai-agent.ts` - 5 complete agent examples
- `/app/api/custom-agent/route.ts` - API implementation
- `/lib/langchain-agent.ts` - Data analysis agent (already integrated)

Happy building! 🚀
