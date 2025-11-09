// Private AI Agent - Secret Access Only
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// Interface for the request
export interface PrivateAgentRequest {
  data?: any;
  question: string;
  context?: string;
  sessionId?: string;
}

// Interface for the response
export interface PrivateAgentResponse {
  content: string;
  error?: string;
}

// In-memory storage for conversation histories
const agentHistories = new Map<string, BaseMessage[]>();

/**
 * System prompt for the private agent
 * This will be replaced with the actual prompt
 */
const SYSTEM_PROMPT = `PLACEHOLDER_PROMPT - This will be replaced with your custom prompt.`;

/**
 * Format data for the AI agent
 */
function formatDataForAgent(data: any): string {
  if (!data) return '';

  // Handle arrays
  if (Array.isArray(data)) {
    const itemCount = data.length;
    const sample = data.slice(0, 10);

    return `
DATA STRUCTURE:
- Type: Array/List
- Total Items: ${itemCount}
- Sample Data (first 10 items):
${JSON.stringify(sample, null, 2)}
`;
  }

  // Handle objects
  if (typeof data === 'object') {
    const keys = Object.keys(data);

    return `
DATA STRUCTURE:
- Type: Object/JSON
- Keys: ${keys.join(', ')}
- Full Data:
${JSON.stringify(data, null, 2)}
`;
  }

  // Handle strings
  if (typeof data === 'string') {
    return `
DATA (Text):
${data.substring(0, 5000)}${data.length > 5000 ? '\n... (truncated)' : ''}
`;
  }

  return `DATA:\n${String(data)}`;
}

/**
 * Get or create conversation history
 */
function getAgentHistory(sessionId: string): BaseMessage[] {
  if (!agentHistories.has(sessionId)) {
    agentHistories.set(sessionId, []);
  }
  return agentHistories.get(sessionId)!;
}

/**
 * Main function: Private AI Agent
 */
export async function analyzeWithPrivateAgent(request: PrivateAgentRequest): Promise<PrivateAgentResponse> {
  try {
    // Initialize the GLM-4.6 model
    const model = new ChatOpenAI({
      modelName: 'glm-4.6',
      temperature: 0.7,  // Balanced creativity and focus
      maxTokens: 4000,
      configuration: {
        baseURL: 'https://api.z.ai/api/paas/v4',
        apiKey: process.env.ZAI_API_KEY,
      },
    });

    // Get conversation history
    const sessionId = request.sessionId || 'default';
    const history = getAgentHistory(sessionId);

    // Format the data if provided
    let formattedData = '';
    if (request.data) {
      formattedData = formatDataForAgent(request.data);
    }

    // Build the complete input message
    const userMessage = `
${request.context ? `CONTEXT:\n${request.context}\n\n` : ''}${formattedData}

REQUEST:
${request.question}
`.trim();

    // Create the message array
    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history,
      new HumanMessage(userMessage),
    ];

    // Send to AI and get response
    const response = await model.invoke(messages);
    const aiResponse = response.content as string;

    // Save to memory
    history.push(new HumanMessage(userMessage));
    history.push(new AIMessage(aiResponse));

    // Keep only last 20 messages
    if (history.length > 20) {
      agentHistories.set(sessionId, history.slice(-20));
    }

    return {
      content: aiResponse,
    };

  } catch (error: any) {
    console.error('Private Agent Error:', error);
    return {
      content: '',
      error: error.message || 'Failed to process request',
    };
  }
}

/**
 * Chat without data
 */
export async function chatWithPrivateAgent(message: string, sessionId: string = 'default'): Promise<PrivateAgentResponse> {
  return analyzeWithPrivateAgent({
    question: message,
    sessionId,
  });
}

/**
 * Clear conversation memory
 */
export function clearPrivateAgentMemory(sessionId: string) {
  agentHistories.delete(sessionId);
}
