// LangChain integration for GLM-4.6 AI Agent with Conversation Memory
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

export interface LangChainRequest {
  prompt: string;
  context?: any;
  sessionId?: string;
}

export interface LangChainResponse {
  content: string;
  error?: string;
}

// In-memory storage for conversation histories (use Redis in production)
const conversationHistories = new Map<string, BaseMessage[]>();

/**
 * Get or create conversation history for a session
 */
function getConversationHistory(sessionId: string): BaseMessage[] {
  if (!conversationHistories.has(sessionId)) {
    conversationHistories.set(sessionId, []);
  }
  return conversationHistories.get(sessionId)!;
}

/**
 * Initialize GLM-4.6 model via LangChain with z.ai endpoint
 */
export function createGLMModel() {
  return new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.7,
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });
}

/**
 * Analyze dataset using LangChain with conversation memory
 */
export async function analyzeWithLangChain(request: LangChainRequest): Promise<LangChainResponse> {
  try {
    const model = createGLMModel();
    const sessionId = request.sessionId || 'default';
    const history = getConversationHistory(sessionId);

    // Create system prompt with dataset context
    const systemPrompt = `You are an expert data analysis AI agent built on GLM-4.6. You help users analyze datasets and extract meaningful insights.

Your capabilities:
- Analyze data patterns and trends
- Identify correlations and anomalies
- Suggest appropriate visualizations
- Provide actionable business insights
- Recommend statistical analysis techniques

When analyzing data:
1. Be specific and actionable
2. Reference actual column names from the dataset
3. Suggest concrete visualizations (bar charts, line charts, pie charts, etc.)
4. Identify key metrics and KPIs
5. Highlight interesting patterns or outliers

${request.context ? `\n\nDataset Context:\n${JSON.stringify(request.context, null, 2)}` : ''}

Keep responses concise and focused on insights that matter.`;

    // Build messages array with conversation history
    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...history,
      new HumanMessage(request.prompt),
    ];

    // Call the model with conversation history
    const response = await model.invoke(messages);

    // Add the user message and AI response to history
    history.push(new HumanMessage(request.prompt));
    history.push(new AIMessage(response.content as string));

    // Keep only last 10 messages (5 exchanges) to prevent context overflow
    if (history.length > 10) {
      conversationHistories.set(sessionId, history.slice(-10));
    }

    return {
      content: response.content as string || 'No response from AI agent',
    };

  } catch (error: any) {
    console.error('LangChain Error:', error);
    return {
      content: '',
      error: error.message || 'Failed to analyze with LangChain agent',
    };
  }
}

/**
 * Clear conversation memory for a session
 */
export function clearConversationMemory(sessionId: string) {
  conversationHistories.delete(sessionId);
}
