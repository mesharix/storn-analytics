// Practical LangChain Agent Examples
// Copy any of these and modify for your needs!

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

/**
 * Helper: Create GLM-4.6 model
 */
function createModel(temperature: number = 0.7, maxTokens: number = 2000) {
  return new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature,
    maxTokens,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });
}

// ============================================================================
// EXAMPLE 1: Simple Question-Answer Agent (No Memory)
// ============================================================================

export async function simpleQAAgent(question: string) {
  const model = createModel(0.5, 1000);

  const messages = [
    new SystemMessage('You are a helpful assistant that answers questions clearly and concisely.'),
    new HumanMessage(question),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Usage:
// const answer = await simpleQAAgent('What is the capital of France?');

// ============================================================================
// EXAMPLE 2: Agent with Conversation Memory
// ============================================================================

const conversations = new Map<string, BaseMessage[]>();

export async function chatAgent(message: string, sessionId: string = 'default') {
  const model = createModel(0.7, 1500);

  // Get or create conversation history
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  const history = conversations.get(sessionId)!;

  const systemPrompt = `You are a friendly AI assistant. Remember the conversation history and provide contextual responses.`;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...history,
    new HumanMessage(message),
  ];

  const response = await model.invoke(messages);
  const aiResponse = response.content as string;

  // Save to history
  history.push(new HumanMessage(message));
  history.push(new AIMessage(aiResponse));

  // Keep only last 10 messages
  if (history.length > 10) {
    conversations.set(sessionId, history.slice(-10));
  }

  return aiResponse;
}

export function clearChat(sessionId: string) {
  conversations.delete(sessionId);
}

// Usage:
// await chatAgent('My name is John', 'user123');
// await chatAgent('What is my name?', 'user123'); // "Your name is John!"

// ============================================================================
// EXAMPLE 3: Agent with Tools/Functions
// ============================================================================

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
}

// Define your tools
const weatherTools = {
  getCurrentWeather: async (location: string): Promise<WeatherData> => {
    // In production, call real weather API
    return {
      location,
      temperature: 72,
      condition: 'Sunny',
    };
  },
};

export async function weatherAgentWithTools(query: string) {
  const model = createModel(0.3, 1000);

  const systemPrompt = `You are a weather assistant with access to weather data.

When users ask about weather, use this format:
TOOL: getCurrentWeather("location")

Then I'll give you the result, and you can respond naturally to the user.`;

  let messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(query),
  ];

  // First call: AI decides to use tool
  let response = await model.invoke(messages);
  let aiResponse = response.content as string;

  // Check if AI wants to use a tool
  const toolMatch = aiResponse.match(/TOOL:\s*getCurrentWeather\("(.+?)"\)/);

  if (toolMatch) {
    const location = toolMatch[1];

    // Execute the tool
    const weatherData = await weatherTools.getCurrentWeather(location);

    // Add tool result to conversation
    messages.push(new AIMessage(aiResponse));
    messages.push(new HumanMessage(`Weather data: ${JSON.stringify(weatherData)}`));

    // Second call: AI responds naturally with the data
    response = await model.invoke(messages);
    aiResponse = response.content as string;
  }

  return aiResponse;
}

// Usage:
// const result = await weatherAgentWithTools('What is the weather in Paris?');

// ============================================================================
// EXAMPLE 4: Multi-Step Reasoning Agent
// ============================================================================

export async function mathTutorAgent(problem: string) {
  const model = createModel(0.3, 2000);

  // Step 1: Understand the problem
  const step1Messages = [
    new SystemMessage('You are a math tutor. Analyze this math problem and explain what needs to be solved.'),
    new HumanMessage(problem),
  ];
  const analysis = await model.invoke(step1Messages);

  // Step 2: Solve step-by-step
  const step2Messages = [
    new SystemMessage('You are a math tutor. Show the step-by-step solution.'),
    new HumanMessage(`Problem: ${problem}\n\nAnalysis: ${analysis.content}\n\nNow solve it step by step.`),
  ];
  const solution = await model.invoke(step2Messages);

  // Step 3: Verify the answer
  const step3Messages = [
    new SystemMessage('You are a math tutor. Verify if the solution is correct.'),
    new HumanMessage(`Problem: ${problem}\n\nSolution: ${solution.content}\n\nIs this correct?`),
  ];
  const verification = await model.invoke(step3Messages);

  return {
    analysis: analysis.content as string,
    solution: solution.content as string,
    verification: verification.content as string,
  };
}

// Usage:
// const result = await mathTutorAgent('Solve: 2x + 5 = 13');

// ============================================================================
// EXAMPLE 5: Router Agent (Multi-Agent System)
// ============================================================================

export async function routerAgent(userQuery: string) {
  const model = createModel(0.3, 500);

  const systemPrompt = `You are a routing agent. Analyze the query and respond with ONE word:

- TECHNICAL: bugs, errors, not working, setup issues
- BILLING: payment, invoice, refund, subscription
- SALES: pricing, features, upgrade, trial
- GENERAL: everything else

Respond with ONLY the category name.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userQuery),
  ];

  const response = await model.invoke(messages);
  return (response.content as string).trim().toUpperCase();
}

async function technicalSupportAgent(query: string) {
  const model = createModel(0.5, 1500);

  const messages = [
    new SystemMessage('You are a technical support specialist. Help users troubleshoot technical issues with clear, step-by-step instructions.'),
    new HumanMessage(query),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

async function billingSupportAgent(query: string) {
  const model = createModel(0.5, 1500);

  const messages = [
    new SystemMessage('You are a billing specialist. Help users with payment, invoices, and subscription issues. Be empathetic and solution-focused.'),
    new HumanMessage(query),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

async function salesAgent(query: string) {
  const model = createModel(0.7, 1500);

  const messages = [
    new SystemMessage('You are a sales specialist. Help users understand pricing, features, and upgrades. Be helpful but not pushy.'),
    new HumanMessage(query),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

async function generalSupportAgent(query: string) {
  const model = createModel(0.6, 1500);

  const messages = [
    new SystemMessage('You are a general support specialist. Help users with account questions, shipping, and general information.'),
    new HumanMessage(query),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

export async function multiAgentSystem(userQuery: string) {
  // Step 1: Route to appropriate specialist
  const category = await routerAgent(userQuery);

  console.log(`🔀 Routing to: ${category}`);

  // Step 2: Call the appropriate specialist
  let response: string;

  switch (category) {
    case 'TECHNICAL':
      response = await technicalSupportAgent(userQuery);
      break;
    case 'BILLING':
      response = await billingSupportAgent(userQuery);
      break;
    case 'SALES':
      response = await salesAgent(userQuery);
      break;
    case 'GENERAL':
    default:
      response = await generalSupportAgent(userQuery);
      break;
  }

  return {
    category,
    response,
  };
}

// Usage:
// const result = await multiAgentSystem('My payment failed');
// console.log(result.category); // 'BILLING'
// console.log(result.response); // Billing specialist's response

// ============================================================================
// EXAMPLE 6: Structured Output Agent (Returns JSON)
// ============================================================================

export async function sentimentAnalysisAgent(text: string) {
  const model = createModel(0.1, 500);

  const systemPrompt = `You are a sentiment analysis agent.

Analyze the sentiment and respond with ONLY valid JSON:

{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0-100,
  "emotions": ["happy", "sad", "angry", "excited", etc],
  "summary": "brief explanation"
}`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Analyze this text: "${text}"`),
  ];

  const response = await model.invoke(messages);
  const jsonString = (response.content as string).replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return { error: 'Failed to parse JSON response' };
  }
}

// Usage:
// const result = await sentimentAnalysisAgent('I absolutely love this product!');
// console.log(result.sentiment); // 'positive'

// ============================================================================
// EXAMPLE 7: Chain of Thought Agent
// ============================================================================

export async function chainOfThoughtAgent(problem: string) {
  const model = createModel(0.5, 2000);

  const systemPrompt = `You are an AI that thinks step-by-step.

Use this format:
1. UNDERSTAND: Restate the problem
2. PLAN: List steps needed
3. EXECUTE: Work through each step
4. VERIFY: Check the answer
5. ANSWER: Final answer`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(problem),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Usage:
// const result = await chainOfThoughtAgent('If a store has 50 apples and sells 30% of them, how many are left?');

// ============================================================================
// EXAMPLE 8: Code Generator Agent
// ============================================================================

export async function codeGeneratorAgent(description: string, language: string = 'typescript') {
  const model = createModel(0.4, 2000);

  const systemPrompt = `You are an expert ${language} developer.

Generate clean, production-ready code with:
1. Clear variable names
2. Proper error handling
3. Type safety (if applicable)
4. Comments for complex logic
5. Best practices

Return ONLY the code, no explanations.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Generate ${language} code: ${description}`),
  ];

  const response = await model.invoke(messages);
  const code = (response.content as string).replace(/```[\w]*\n|```/g, '').trim();

  return code;
}

// Usage:
// const code = await codeGeneratorAgent('A function that validates email addresses', 'typescript');

// ============================================================================
// EXAMPLE 9: Translation Agent with Context
// ============================================================================

export async function translationAgent(
  text: string,
  targetLanguage: string,
  context?: string
) {
  const model = createModel(0.3, 1500);

  const systemPrompt = `You are a professional translator.

Translate to ${targetLanguage} while:
- Maintaining tone and style
- Preserving cultural context
- Using natural phrasing
${context ? `\nContext: ${context}` : ''}

Return ONLY the translation.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(text),
  ];

  const response = await model.invoke(messages);
  return response.content as string;
}

// Usage:
// const translation = await translationAgent('Hello, how are you?', 'Spanish', 'Casual conversation with a friend');

// ============================================================================
// EXAMPLE 10: Data Extraction Agent
// ============================================================================

export async function dataExtractionAgent(text: string, fields: string[]) {
  const model = createModel(0.1, 1000);

  const systemPrompt = `You are a data extraction specialist.

Extract these fields from the text: ${fields.join(', ')}

Respond with ONLY valid JSON containing the extracted fields.
If a field is not found, set it to null.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(text),
  ];

  const response = await model.invoke(messages);
  const jsonString = (response.content as string).replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return { error: 'Failed to extract data' };
  }
}

// Usage:
// const data = await dataExtractionAgent(
//   'John Doe, email: john@example.com, phone: 555-1234',
//   ['name', 'email', 'phone']
// );
// console.log(data); // { name: 'John Doe', email: 'john@example.com', phone: '555-1234' }
