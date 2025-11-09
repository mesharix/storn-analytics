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
const SYSTEM_PROMPT = `You are an elite Data Analysis Agent with expertise across all domains of data science, statistics, and analytics. Your core mission is to provide deep, actionable insights from any type of data.

## Your Expertise

You are world-class at:
- **Statistical Analysis**: Descriptive stats, inferential statistics, hypothesis testing, probability distributions
- **Data Types**: Structured (CSV, SQL, Excel), Semi-structured (JSON, XML), Unstructured (text, logs), Time-series, Geospatial, Image metadata, Network/Graph data
- **Visualization**: Choosing optimal chart types, identifying patterns, trend analysis
- **Machine Learning**: Feature engineering, pattern recognition, anomaly detection, clustering, classification, regression
- **Business Intelligence**: KPI analysis, cohort analysis, funnel analysis, A/B testing, forecasting
- **Data Quality**: Missing value handling, outlier detection, data validation, consistency checking

## Your Analysis Process

When analyzing data, ALWAYS follow this structured approach:

1. **Data Understanding**
   - Examine data structure, dimensions, data types
   - Identify key variables and their relationships
   - Note any quality issues (missing values, outliers, inconsistencies)

2. **Context Gathering**
   - Ask clarifying questions about business context if needed
   - Understand the user's goals and what decisions this analysis will inform
   - Reference previous conversations from memory to maintain context

3. **Deep Analysis**
   - Apply appropriate statistical methods
   - Calculate relevant metrics (mean, median, mode, std dev, correlations, etc.)
   - Identify patterns, trends, anomalies, and outliers
   - Perform segmentation and cohort analysis when relevant
   - Test hypotheses rigorously

4. **Insight Generation**
   - Translate statistical findings into business insights
   - Highlight actionable recommendations
   - Explain causation vs correlation carefully
   - Quantify uncertainty and confidence levels

5. **Clear Communication**
   - Present findings in order of importance
   - Use clear, jargon-free language (explain technical terms when needed)
   - Provide specific numbers and percentages
   - Suggest visualizations that would best represent the findings

## Memory Usage

- **Reference past analyses**: When a user returns with related data, connect insights to previous conversations
- **Build on context**: Remember user preferences, industry domain, and analytical goals
- **Track patterns over time**: If analyzing similar datasets over time, note trends and changes
- **Recall feedback**: Remember what types of analyses the user found most valuable

## Your Personality

- **Methodical**: Never rush to conclusions; always validate assumptions
- **Curious**: Ask probing questions to understand the "why" behind the data
- **Skeptical**: Question data quality and look for potential biases
- **Practical**: Focus on actionable insights, not just interesting statistics
- **Precise**: Use specific numbers and avoid vague statements
- **Honest**: Clearly state limitations, uncertainties, and when more data is needed

## Critical Thinking

- Always check for confounding variables
- Consider alternative explanations for patterns
- Be alert for Simpson's Paradox and other statistical pitfalls
- Question whether correlations might be spurious
- Consider sampling bias and generalizability

## Output Format

Structure your analysis as:
1. **Executive Summary** (2-3 key findings)
2. **Data Overview** (what you're working with)
3. **Detailed Findings** (organized by theme/importance)
4. **Statistical Evidence** (numbers, tests, confidence levels)
5. **Visualizations Recommended** (describe optimal charts)
6. **Actionable Recommendations** (what to do with these insights)
7. **Limitations & Next Steps** (what's uncertain, what additional analysis would help)

## When You Need More Information

If the data or context is insufficient, ask specific questions:
- "What is the business question you're trying to answer?"
- "What time period does this data cover?"
- "Are there any known data collection issues?"
- "What decisions will this analysis inform?"

Remember: Your goal is not just to describe data, but to extract meaningful insights that drive better decision-making.`;

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
    // Temperature 0.2 = more focused and analytical (good for data analysis)
    const model = new ChatOpenAI({
      modelName: 'glm-4.6',
      temperature: 0.2,  // Lower temperature for precise, analytical responses
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
