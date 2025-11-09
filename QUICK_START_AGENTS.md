# Quick Start: Test Your LangChain Agents

All agents are ready to use! Here's how to test each one.

## API Endpoint
```
POST http://localhost:3000/api/example-agents
```

---

## 1. Simple Q&A Agent (No Memory)

**What it does**: Answers questions without remembering previous conversations

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "simple-qa",
    "question": "What is the capital of France?"
  }'
```

**Response**:
```json
{
  "success": true,
  "agentType": "simple-qa",
  "result": "The capital of France is Paris."
}
```

---

## 2. Chat Agent (WITH Memory!)

**What it does**: Remembers your conversation using sessionId

```bash
# First message
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "chat",
    "sessionId": "user123",
    "message": "My name is John"
  }'

# Second message - it remembers!
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "chat",
    "sessionId": "user123",
    "message": "What is my name?"
  }'
```

**Response**: "Your name is John!"

**Clear chat memory**:
```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "clear-chat",
    "sessionId": "user123"
  }'
```

---

## 3. Weather Agent (WITH Tools)

**What it does**: Uses tools to get weather data

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "weather",
    "query": "What is the weather in Paris?"
  }'
```

**Response**: Natural language response using weather data from the tool

---

## 4. Math Tutor (Multi-Step Reasoning)

**What it does**: Solves math problems step-by-step with analysis and verification

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "math-tutor",
    "problem": "Solve: 2x + 5 = 13"
  }'
```

**Response**:
```json
{
  "analysis": "This is a linear equation...",
  "solution": "Step 1: Subtract 5... Step 2: Divide by 2... x = 4",
  "verification": "Let's verify: 2(4) + 5 = 13 ✓"
}
```

---

## 5. Multi-Agent Support System

**What it does**: Routes your question to the right specialist (Technical, Billing, Sales, or General)

```bash
# Technical issue
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "support",
    "query": "The app crashes when I click login"
  }'

# Billing issue
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "support",
    "query": "I was charged twice for my subscription"
  }'

# Sales question
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "support",
    "query": "What features are included in the Pro plan?"
  }'
```

**Response**:
```json
{
  "category": "TECHNICAL",
  "response": "I understand the app is crashing... Let's troubleshoot..."
}
```

---

## 6. Sentiment Analysis (Returns JSON)

**What it does**: Analyzes sentiment and returns structured data

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "sentiment",
    "text": "I absolutely love this product! Best purchase ever!"
  }'
```

**Response**:
```json
{
  "sentiment": "positive",
  "confidence": 95,
  "emotions": ["happy", "excited", "satisfied"],
  "summary": "Highly positive sentiment expressing strong satisfaction"
}
```

---

## 7. Chain of Thought Agent

**What it does**: Breaks down complex problems step-by-step

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "chain-of-thought",
    "problem": "If a store has 50 apples and sells 30% of them, how many are left?"
  }'
```

**Response**:
```
1. UNDERSTAND: Store has 50 apples, sells 30%
2. PLAN: Calculate 30% of 50, then subtract
3. EXECUTE: 30% × 50 = 15 apples sold, 50 - 15 = 35
4. VERIFY: 15 is 30% of 50 ✓
5. ANSWER: 35 apples remain
```

---

## 8. Code Generator

**What it does**: Generates production-ready code in any language

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "code-gen",
    "description": "A function that validates email addresses",
    "language": "typescript"
  }'
```

**Response**: Clean, working TypeScript code

```bash
# Python example
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "code-gen",
    "description": "A class for managing user sessions",
    "language": "python"
  }'
```

---

## 9. Translation Agent

**What it does**: Translates text while maintaining tone and context

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "translate",
    "text": "Hello, how are you doing today?",
    "targetLanguage": "Spanish",
    "context": "Casual conversation with a friend"
  }'
```

**Response**: "¡Hola! ¿Cómo estás hoy?"

```bash
# Professional context
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "translate",
    "text": "We need to discuss the quarterly results",
    "targetLanguage": "French",
    "context": "Business meeting"
  }'
```

---

## 10. Data Extraction Agent

**What it does**: Extracts structured data from unstructured text

```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "extract",
    "text": "Contact John Doe at john@example.com or call 555-1234",
    "fields": ["name", "email", "phone"]
  }'
```

**Response**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234"
}
```

**More complex example**:
```bash
curl -X POST http://localhost:3000/api/example-agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "extract",
    "text": "Order #12345 for $199.99 placed on Jan 15, 2025 by Jane Smith",
    "fields": ["order_id", "amount", "date", "customer"]
  }'
```

---

## Full Code Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Simple Q&A
const response = await fetch('/api/example-agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'simple-qa',
    question: 'What is machine learning?',
  }),
});
const data = await response.json();
console.log(data.result);

// Chat with memory
const chat1 = await fetch('/api/example-agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'chat',
    sessionId: 'user456',
    message: 'I like pizza',
  }),
});

const chat2 = await fetch('/api/example-agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'chat',
    sessionId: 'user456',
    message: 'What food do I like?',
  }),
});

// Sentiment analysis
const sentiment = await fetch('/api/example-agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentType: 'sentiment',
    text: 'This is the worst experience ever!',
  }),
});
const sentimentData = await sentiment.json();
console.log(sentimentData.result.sentiment); // 'negative'
```

### Python

```python
import requests

# Simple Q&A
response = requests.post('http://localhost:3000/api/example-agents', json={
    'agentType': 'simple-qa',
    'question': 'What is quantum computing?'
})
print(response.json()['result'])

# Multi-agent support
response = requests.post('http://localhost:3000/api/example-agents', json={
    'agentType': 'support',
    'query': 'I need help with my account settings'
})
data = response.json()
print(f"Routed to: {data['result']['category']}")
print(f"Response: {data['result']['response']}")

# Code generation
response = requests.post('http://localhost:3000/api/example-agents', json={
    'agentType': 'code-gen',
    'description': 'A function to check if a number is prime',
    'language': 'python'
})
print(response.json()['result'])
```

---

## Next Steps

1. **Try all 10 examples** to see what's possible
2. **Modify them** - Change temperatures, prompts, add your own tools
3. **Create your own** - Copy any example and customize it
4. **Read the guides**:
   - [LANGCHAIN_AGENT_GUIDE.md](LANGCHAIN_AGENT_GUIDE.md) - Complete LangChain tutorial
   - [HOW_TO_CREATE_AI_AGENTS.md](HOW_TO_CREATE_AI_AGENTS.md) - General AI agent guide
   - [lib/example-agents.ts](lib/example-agents.ts) - Source code for all examples

---

## Temperature Guide

- **0.0-0.3**: Focused, deterministic (use for: SQL, code, data extraction, math)
- **0.4-0.7**: Balanced (use for: general chat, Q&A, support)
- **0.8-1.0**: Creative (use for: writing, brainstorming, storytelling)

## Common Patterns

### Pattern 1: Add a Tool
```typescript
const tools = {
  myTool: async (param: string) => {
    // Do something
    return result;
  }
};

// In system prompt:
"When you need data, use: TOOL: myTool('param')"
```

### Pattern 2: Add Memory
```typescript
const memory = new Map<string, BaseMessage[]>();

// Store: memory.set(sessionId, messages);
// Retrieve: const history = memory.get(sessionId) || [];
```

### Pattern 3: Multi-Step
```typescript
const step1 = await model.invoke([...]);
const step2 = await model.invoke([..., step1result]);
const step3 = await model.invoke([..., step2result]);
```

### Pattern 4: Structured Output
```typescript
// In system prompt:
"Respond with ONLY valid JSON: { field: value }"

// Parse response:
const data = JSON.parse(response.content);
```

Happy building! 🚀
