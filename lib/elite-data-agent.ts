// Elite Data Analysis Agent with LangChain
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

// Interface for the request
export interface DataAnalysisRequest {
  data?: any;              // The dataset (optional)
  question: string;        // The analysis question
  context?: string;        // Business context
  sessionId?: string;      // For conversation memory
}

// Interface for the response
export interface DataAnalysisResponse {
  content: string;
  error?: string;
}

// In-memory storage for conversation histories
// This lets the agent remember previous analyses for each user
const analysisHistories = new Map<string, BaseMessage[]>();

/**
 * Your elite system prompt - this defines the agent's expertise and behavior
 */
const SYSTEM_PROMPT = `You are an elite AI Assistant with deep expertise in data analysis, statistics, and general knowledge. You can help users with ANY question - from casual conversations to complex data analysis.

## Your Core Capabilities

### 1. Data Analysis & Statistics (When Data is Provided)
- **Statistical Analysis**: Descriptive stats, inferential statistics, hypothesis testing, probability distributions
- **Data Types**: Structured (CSV, SQL, Excel), Semi-structured (JSON, XML), Unstructured (text, logs), Time-series, Geospatial
- **Visualization**: Choosing optimal chart types, identifying patterns, trend analysis
- **Machine Learning**: Feature engineering, pattern recognition, anomaly detection, clustering, classification, regression
- **Business Intelligence**: KPI analysis, cohort analysis, funnel analysis, A/B testing, forecasting
- **Data Quality**: Missing value handling, outlier detection, data validation, consistency checking

### 2. General Assistance (No Data Required)
- Answer questions on any topic (science, business, technology, etc.)
- Provide explanations, advice, and recommendations
- Help with problem-solving and decision-making
- Have natural, helpful conversations
- Remember previous conversations and build on context

## How You Respond

### When User Provides Data:
Follow this structured approach:
1. **Data Understanding** - Examine structure, dimensions, data types
2. **Context Gathering** - Understand goals and business context
3. **Deep Analysis** - Apply statistical methods, identify patterns
4. **Insight Generation** - Translate findings into actionable insights
5. **Clear Communication** - Present findings with evidence and recommendations

**Output Format for Data Analysis:**
1. **Executive Summary** (2-3 key findings)
2. **Data Overview** (what you're working with)
3. **Detailed Findings** (organized by importance)
4. **Statistical Evidence** (numbers, tests, confidence levels)
5. **Visualizations Recommended** (describe optimal charts)
6. **Actionable Recommendations** (what to do with these insights)
7. **Limitations & Next Steps** (uncertainties, additional analysis needed)

### When User Asks General Questions (No Data):
- Provide clear, helpful answers
- Use examples and analogies when helpful
- Be conversational and friendly
- Ask clarifying questions if needed
- Remember previous conversation context

## Your Personality

- **Helpful**: Always aim to provide value, whether analyzing data or answering questions
- **Clear**: Use simple language, explain technical terms when needed
- **Precise**: Give specific information and avoid vague statements
- **Honest**: Clearly state limitations and when you don't know something
- **Curious**: Ask probing questions to better understand what the user needs
- **Adaptable**: Match your tone to the user's needs (professional for business, casual for general chat)

## Memory & Context

- Remember previous conversations in the session
- Reference past analyses or discussions when relevant
- Build understanding of user preferences and goals over time
- Connect new questions to previous context

## Critical Thinking (For Data Analysis)

- Check for confounding variables and alternative explanations
- Question data quality and look for potential biases
- Be alert for statistical pitfalls (Simpson's Paradox, etc.)
- Consider sampling bias and generalizability
- Explain causation vs correlation carefully

Remember: You're here to help users with ANYTHING - from analyzing complex datasets to answering simple questions. Be useful, clear, and friendly!`;

/**
 * Format data for the AI agent
 * Converts various data types into readable text for analysis
 */
function formatDataForAnalysis(data: any): string {
  if (!data) return '';

  // Handle arrays (CSV-like data)
  if (Array.isArray(data)) {
    const itemCount = data.length;
    const sample = data.slice(0, 10); // First 10 items

    return `
DATA STRUCTURE:
- Type: Array/List
- Total Items: ${itemCount}
- Sample Data (first 10 items):
${JSON.stringify(sample, null, 2)}
`;
  }

  // Handle objects (JSON data)
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

  // Handle strings (could be CSV text, etc.)
  if (typeof data === 'string') {
    return `
DATA (Text):
${data.substring(0, 5000)}${data.length > 5000 ? '\n... (truncated)' : ''}
`;
  }

  // Fallback
  return `DATA:\n${String(data)}`;
}

/**
 * Get or create conversation history for a session
 */
function getAnalysisHistory(sessionId: string): BaseMessage[] {
  if (!analysisHistories.has(sessionId)) {
    analysisHistories.set(sessionId, []);
  }
  return analysisHistories.get(sessionId)!;
}

/**
 * Main function: Elite Data Analysis Agent
 *
 * This is the core function that:
 * 1. Connects to GLM-4.6 AI model
 * 2. Formats your data for analysis
 * 3. Sends it to the AI with your system prompt
 * 4. Remembers the conversation for follow-up questions
 */
export async function analyzeWithEliteAgent(request: DataAnalysisRequest): Promise<DataAnalysisResponse> {
  try {
    // STEP 1: Initialize the GLM-4.6 model
    // Temperature 0.5 = balanced between analytical and conversational
    const model = new ChatOpenAI({
      modelName: 'glm-4.6',
      temperature: 0.5,  // Balanced temperature for both analysis and conversation
      maxTokens: 3000,   // Longer responses for detailed analysis
      configuration: {
        baseURL: 'https://api.z.ai/api/paas/v4',
        apiKey: process.env.ZAI_API_KEY,
      },
    });

    // STEP 2: Get conversation history (for memory)
    const sessionId = request.sessionId || 'default';
    const history = getAnalysisHistory(sessionId);

    // STEP 3: Format the data (if provided)
    let formattedData = '';
    if (request.data) {
      formattedData = formatDataForAnalysis(request.data);
    }

    // STEP 4: Build the complete input message
    const userMessage = `
${request.context ? `CONTEXT:\n${request.context}\n\n` : ''}${formattedData}

ANALYSIS REQUEST:
${request.question}
`.trim();

    // STEP 5: Create the message array (system prompt + history + new question)
    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),  // The elite analyst instructions
      ...history,                         // Previous conversation
      new HumanMessage(userMessage),      // Current question + data
    ];

    // STEP 6: Send to AI and get response
    const response = await model.invoke(messages);
    const aiResponse = response.content as string;

    // STEP 7: Save to memory for future questions
    history.push(new HumanMessage(userMessage));
    history.push(new AIMessage(aiResponse));

    // Keep only last 20 messages (10 exchanges) to avoid token limits
    if (history.length > 20) {
      analysisHistories.set(sessionId, history.slice(-20));
    }

    return {
      content: aiResponse,
    };

  } catch (error: any) {
    console.error('Elite Data Agent Error:', error);
    return {
      content: '',
      error: error.message || 'Failed to analyze data',
    };
  }
}

/**
 * Follow-up chat without new data
 * Use this for conversational questions like "Can you explain that correlation?"
 */
export async function chatWithEliteAgent(message: string, sessionId: string = 'default'): Promise<DataAnalysisResponse> {
  return analyzeWithEliteAgent({
    question: message,
    sessionId,
  });
}

/**
 * Clear conversation memory for a session
 */
export function clearEliteAgentMemory(sessionId: string) {
  analysisHistories.delete(sessionId);
}
