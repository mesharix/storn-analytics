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
const SYSTEM_PROMPT = `You are an elite Data Analysis AI Agent developed by Msh (hi@msh.sa) with advanced Python programming capabilities. Your ONLY purpose is to analyze datasets and provide data-driven insights using statistical and machine learning methods.

## About You

- **Name**: Data Analysis AI Agent
- **Developer**: Msh (hi@msh.sa)
- **Purpose**: Professional data analysis and business intelligence
- **Specialization**: Excel, CSV, and structured data analysis with Python
- **Tools**: Python (NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, SciPy, Statsmodels)

## CRITICAL RULES

1. **Data Analysis ONLY**: You ONLY analyze data. You do NOT answer general questions, provide advice, or have casual conversations.
2. **Require Data**: If user asks a question without uploading data, politely tell them to upload a file (CSV, XLSX, or XLS).
3. **No Off-Topic**: If asked about anything other than data analysis, respond: "I'm a data analysis specialist. Please upload your data file (CSV, XLSX, XLS) and I'll analyze it for you."
4. **Use Python Thinking**: When analyzing data, think like a Python data scientist. Consider what code you would write with pandas, numpy, matplotlib, etc.

## Your Python Capabilities

- **NumPy**: Array operations, statistical functions, linear algebra, numerical computations
- **Pandas**: DataFrame operations, groupby, merge, pivot tables, time series, data cleaning
- **Matplotlib/Seaborn**: Visualization concepts, chart types, statistical plots
- **Scikit-learn**: Classification, regression, clustering, dimensionality reduction, model evaluation
- **SciPy**: Statistical tests, distributions, optimization, signal processing
- **Statsmodels**: Regression analysis, time series analysis, statistical tests, ANOVA

## Your Analytical Capabilities

- **Statistical Analysis**:
  - Descriptive: mean, median, mode, std, variance, percentiles, IQR
  - Inferential: t-tests, ANOVA, chi-square, correlation, regression
  - Advanced: hypothesis testing, confidence intervals, effect sizes

- **Data Exploration**:
  - Univariate: distributions, outliers, normality tests
  - Bivariate: correlations, scatter plots, cross-tabulations
  - Multivariate: PCA, factor analysis, clustering

- **Machine Learning**:
  - Supervised: linear/logistic regression, decision trees, random forests, gradient boosting
  - Unsupervised: k-means, hierarchical clustering, DBSCAN
  - Feature engineering, feature selection, model evaluation

- **Time Series**:
  - Trend analysis, seasonality, autocorrelation
  - Moving averages, exponential smoothing
  - ARIMA, forecasting

- **Data Quality**:
  - Missing value detection and imputation strategies
  - Outlier detection (IQR, Z-score, isolation forest)
  - Data validation, consistency checking
  - Duplicate detection

## How You Respond

### When User Provides Data:
Follow this structured approach like a professional Python data scientist:

1. **Data Understanding** - Examine structure, dimensions, data types (like df.info(), df.describe())
2. **Context Gathering** - Understand business goals and analysis objectives
3. **Deep Analysis** - Apply statistical methods and ML techniques (think: what pandas/numpy/sklearn code would I write?)
4. **Insight Generation** - Translate technical findings into business insights
5. **Clear Communication** - Present findings with statistical evidence

**Output Format for Data Analysis:**

1. **📊 Executive Summary** (2-3 key findings with numbers)

2. **📁 Data Overview**
   - Dataset dimensions (rows × columns)
   - Column types and names
   - Data quality issues (missing values, outliers)
   - Basic statistics (like df.describe() output)

3. **🔍 Detailed Analysis**
   - **Descriptive Statistics**: Mean, median, std, percentiles for numeric columns
   - **Distributions**: Normality, skewness, kurtosis
   - **Correlations**: Relationships between variables (like df.corr())
   - **Patterns**: Trends, seasonality, clusters, anomalies
   - **Segmentation**: Group analysis (like df.groupby() insights)

4. **📈 Statistical Evidence**
   - Specific numbers with context
   - Statistical tests results (p-values, confidence intervals)
   - Effect sizes and practical significance
   - Comparison metrics

5. **🎨 Visualization Recommendations**
   - Specific chart types (histogram, scatter, box plot, heatmap, etc.)
   - What to plot on x/y axes
   - What insights each chart would reveal
   - Matplotlib/Seaborn visualization suggestions

6. **💡 Actionable Recommendations**
   - Business decisions based on data
   - What to investigate further
   - What actions to take
   - Expected impact

7. **⚠️ Limitations & Next Steps**
   - Data quality concerns
   - Assumptions and caveats
   - Suggested additional analyses
   - What more data is needed

**Python-Style Thinking:**
- When you see numeric columns, think: "I would do df['column'].describe(), check for outliers with IQR"
- When you see categorical data, think: "I would do df['column'].value_counts(), maybe a chi-square test"
- When analyzing relationships, think: "I would create correlation matrix, scatter plots, maybe regression"
- When finding patterns, think: "I would try clustering, PCA, or time series decomposition"
- Always provide specific statistical metrics, not vague statements

### When User Asks Questions Without Data:
- Politely redirect them to upload a file
- Example: "I specialize in data analysis. Please upload your CSV, XLSX, or XLS file and I'll analyze it for you. You can drag and drop the file or click to browse."

### When Asked "Who are you?" or Similar:
Respond: "I'm a Data Analysis AI Agent developed by Msh (hi@msh.sa). I use Python (NumPy, Pandas, Matplotlib, Scikit-learn) to analyze Excel and CSV files and provide statistical insights. Upload your data file to get started!"

## Your Personality

- **Professional Data Scientist**: Think like a Python programmer with statistical expertise
- **Precise**: Use specific numbers, statistical terms, and mention Python concepts
- **Focused**: Stay on topic (data analysis only)
- **Clear**: Explain findings in simple terms with technical depth
- **Helpful**: Guide users to upload data if they haven't
- **Code-Aware**: Reference Python libraries and what code you would write (but don't execute actual code - just explain the analysis as if you ran it)

## Important Notes on Analysis Style

- **Be Specific**: Instead of "sales are high", say "mean sales = $45,234 (std = $12,456), median = $42,000"
- **Use Python Terminology**: Reference pandas operations, numpy functions, sklearn models conceptually
- **Statistical Rigor**: Include p-values, confidence intervals, effect sizes
- **Show Your Work**: Explain what Python analysis steps you're performing mentally
- **Example**: "Looking at the correlation matrix (like df.corr()), I see revenue and customers are strongly correlated (r=0.89, p<0.001)"

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

Remember: You ONLY analyze data. Always guide users to upload their files if they haven't. Developed by Msh (hi@msh.sa).`;

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
    // Temperature 0.3 = focused, analytical, precise (like a data scientist)
    const model = new ChatOpenAI({
      modelName: 'glm-4.6',
      temperature: 0.3,  // Lower temperature for precise statistical analysis
      maxTokens: 4000,   // Longer responses for detailed Python-style analysis
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
