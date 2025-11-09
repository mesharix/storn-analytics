// LangChain integration for GLM-4.6 AI Agent with Conversation Memory
import { ChatOpenAI } from '@langchain/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

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
const conversationMemories = new Map<string, BufferMemory>();

/**
 * Get or create conversation memory for a session
 */
function getConversationMemory(sessionId: string): BufferMemory {
  if (!conversationMemories.has(sessionId)) {
    conversationMemories.set(sessionId, new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
    }));
  }
  return conversationMemories.get(sessionId)!;
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
    const memory = getConversationMemory(sessionId);

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

    // Create conversation chain with memory
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
    });

    // Run the chain with the user's question
    const response = await chain.call({
      input: request.prompt,
      system: systemPrompt,
    });

    return {
      content: response.response || 'No response from AI agent',
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
  conversationMemories.delete(sessionId);
}

/**
 * Get conversation history for a session
 */
export async function getConversationHistory(sessionId: string): Promise<string[]> {
  const memory = conversationMemories.get(sessionId);
  if (!memory) return [];

  try {
    const history = await memory.loadMemoryVariables({});
    const messages = history.chat_history || [];
    return messages.map((msg: any) => msg.content);
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}
