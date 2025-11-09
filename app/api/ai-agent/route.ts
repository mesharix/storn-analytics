import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4';

// Initialize OpenAI client with z.ai configuration
const client = new OpenAI({
  apiKey: ZAI_API_KEY,
  baseURL: ZAI_BASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, tools } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build messages array
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert data analysis AI agent built on GLM-4.6. You help users analyze datasets and extract meaningful insights.

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

Keep responses concise and focused on insights that matter.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Add context if provided
    if (context) {
      messages[1].content += `\n\nDataset Context:\n${JSON.stringify(context, null, 2)}`;
    }

    // Call GLM-4.6 API using OpenAI SDK compatibility
    const completion = await client.chat.completions.create({
      model: 'glm-4.6',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      // @ts-ignore - GLM-4.6 specific parameter for enhanced reasoning
      thinking: { type: 'enabled' },
      tools: tools || undefined,
    });

    const response = completion.choices[0].message;

    // Handle tool calls if present
    if (response.tool_calls && response.tool_calls.length > 0) {
      return NextResponse.json({
        content: response.content,
        tool_calls: response.tool_calls,
        finish_reason: completion.choices[0].finish_reason
      });
    }

    return NextResponse.json({
      content: response.content,
      finish_reason: completion.choices[0].finish_reason,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('GLM-4.6 API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to call GLM-4.6 API',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
