// GLM-4.6 AI Agent Utilities for Data Analysis

export interface AnalysisRequest {
  dataset: any;
  question: string;
  columns?: string[];
  recordCount?: number;
}

export interface AgentResponse {
  content: string;
  suggestions?: string[];
  error?: string;
}

export interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

// Data analysis tools that GLM-4.6 can use
export const ANALYSIS_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'calculate_statistics',
      description: 'Calculate statistical metrics like mean, median, mode, standard deviation for a numeric column',
      parameters: {
        type: 'object',
        properties: {
          column: {
            type: 'string',
            description: 'Column name to analyze'
          },
          metrics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Metrics to calculate: mean, median, mode, stddev, min, max, count'
          }
        },
        required: ['column', 'metrics']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'identify_correlations',
      description: 'Find correlations between numeric columns in the dataset',
      parameters: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Column names to analyze for correlation (minimum 2 columns)'
          }
        },
        required: ['columns']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_visualization',
      description: 'Recommend the best chart type and configuration for visualizing data',
      parameters: {
        type: 'object',
        properties: {
          x_axis: {
            type: 'string',
            description: 'Column for X-axis'
          },
          y_axis: {
            type: 'string',
            description: 'Column for Y-axis'
          },
          chart_type: {
            type: 'string',
            enum: ['bar', 'line', 'pie', 'scatter', 'area'],
            description: 'Recommended chart type'
          },
          purpose: {
            type: 'string',
            description: 'Purpose: comparison, distribution, trend, composition, or relationship'
          }
        },
        required: ['chart_type', 'purpose']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'detect_anomalies',
      description: 'Detect outliers or anomalies in numeric data',
      parameters: {
        type: 'object',
        properties: {
          column: {
            type: 'string',
            description: 'Column name to check for anomalies'
          },
          method: {
            type: 'string',
            enum: ['zscore', 'iqr', 'isolation_forest'],
            description: 'Method to use for anomaly detection'
          }
        },
        required: ['column']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'segment_data',
      description: 'Segment or group data based on criteria',
      parameters: {
        type: 'object',
        properties: {
          group_by: {
            type: 'string',
            description: 'Column to group by'
          },
          aggregate: {
            type: 'string',
            description: 'Column to aggregate'
          },
          operation: {
            type: 'string',
            enum: ['sum', 'average', 'count', 'min', 'max'],
            description: 'Aggregation operation'
          }
        },
        required: ['group_by', 'operation']
      }
    }
  }
];

/**
 * Main function to analyze dataset using GLM-4.6 AI agent
 */
export async function analyzeWithGLM(request: AnalysisRequest): Promise<AgentResponse> {
  try {
    // Prepare dataset summary for the AI
    const datasetSummary = {
      name: request.dataset?.name || 'Untitled Dataset',
      totalRecords: request.recordCount || request.dataset?.records?.length || 0,
      columns: request.columns || [],
      sampleData: request.dataset?.records?.slice(0, 3).map((r: any) => r.data) || []
    };

    // Build the prompt with context
    const prompt = `Dataset: "${datasetSummary.name}"
Total Records: ${datasetSummary.totalRecords}
Columns: ${datasetSummary.columns.join(', ')}

Question: ${request.question}

Please analyze this dataset and provide:
1. Direct answer to the question
2. Specific insights based on the available columns
3. Recommended visualizations or analysis techniques
4. Any patterns or trends you notice

Be specific and reference actual column names when making suggestions.`;

    // Call the API
    const response = await fetch('/api/ai-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        context: datasetSummary,
        tools: ANALYSIS_TOOLS
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get AI response');
    }

    const data = await response.json();

    return {
      content: data.content || 'No response from AI agent',
      suggestions: extractSuggestions(data.content)
    };

  } catch (error: any) {
    console.error('GLM Agent Error:', error);
    return {
      content: '',
      error: error.message || 'Failed to analyze with AI agent'
    };
  }
}

/**
 * Extract actionable suggestions from AI response
 */
function extractSuggestions(content: string): string[] {
  if (!content) return [];

  const suggestions: string[] = [];
  const lines = content.split('\n');

  lines.forEach(line => {
    // Look for lines that suggest actions
    if (
      line.includes('recommend') ||
      line.includes('suggest') ||
      line.includes('should') ||
      line.includes('could') ||
      line.includes('try')
    ) {
      const cleaned = line.replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 10) {
        suggestions.push(cleaned);
      }
    }
  });

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Quick insights generator for common questions
 */
export const QUICK_QUESTIONS = [
  'What are the key insights from this data?',
  'What patterns or trends do you see?',
  'Which columns should I focus on for analysis?',
  'What visualizations would you recommend?',
  'Are there any anomalies or outliers?',
  'How can I segment this data?',
  'What correlations exist in the data?',
  'What are the most important metrics?'
];

/**
 * Stream responses for better UX (optional enhancement)
 */
export async function streamAnalysis(request: AnalysisRequest): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const result = await analyzeWithGLM(request);

        if (result.error) {
          controller.enqueue(encoder.encode(`Error: ${result.error}`));
        } else {
          // Simulate streaming by chunking the response
          const words = result.content.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(word + ' '));
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
