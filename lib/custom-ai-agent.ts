// Custom AI Agent Template - Build Your Own AI Agent
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

/**
 * CUSTOM AI AGENT BUILDER
 *
 * This template shows you how to create your own AI agents with custom:
 * - Personalities and behaviors
 * - Knowledge domains
 * - Tools and capabilities
 * - Memory and context
 */

// ============================================
// EXAMPLE 1: Sales Assistant Agent
// ============================================

export interface SalesAgentRequest {
  customerQuery: string;
  productCatalog?: any[];
  customerHistory?: any;
  sessionId?: string;
}

const salesConversations = new Map<string, BaseMessage[]>();

export async function salesAssistantAgent(request: SalesAgentRequest) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.7,
    maxTokens: 1500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const sessionId = request.sessionId || 'default';
  const history = salesConversations.get(sessionId) || [];

  const systemPrompt = `You are a professional sales assistant for an e-commerce platform.

Your personality:
- Friendly, helpful, and enthusiastic
- Focus on customer needs first
- Suggestive but never pushy
- Always provide value

Your capabilities:
- Recommend products based on customer needs
- Answer questions about products, pricing, and availability
- Help with order issues and returns
- Upsell and cross-sell appropriately

${request.productCatalog ? `\n\nAvailable Products:\n${JSON.stringify(request.productCatalog, null, 2)}` : ''}
${request.customerHistory ? `\n\nCustomer History:\n${JSON.stringify(request.customerHistory, null, 2)}` : ''}

Always be concise, friendly, and helpful.`;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...history,
    new HumanMessage(request.customerQuery),
  ];

  const response = await model.invoke(messages);

  history.push(new HumanMessage(request.customerQuery));
  history.push(new AIMessage(response.content as string));

  if (history.length > 10) {
    salesConversations.set(sessionId, history.slice(-10));
  } else {
    salesConversations.set(sessionId, history);
  }

  return {
    content: response.content as string,
    sessionId,
  };
}

// ============================================
// EXAMPLE 2: Code Review Agent
// ============================================

export interface CodeReviewRequest {
  code: string;
  language: string;
  focusAreas?: string[]; // e.g., ['security', 'performance', 'readability']
}

export async function codeReviewAgent(request: CodeReviewRequest) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.3, // Lower temperature for more focused technical analysis
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const focusAreas = request.focusAreas || ['security', 'performance', 'best-practices', 'readability'];

  const systemPrompt = `You are an expert code reviewer with deep knowledge of ${request.language}.

Your review should focus on:
${focusAreas.map(area => `- ${area.charAt(0).toUpperCase() + area.slice(1)}`).join('\n')}

Provide:
1. Overall assessment (Good/Needs Improvement/Critical Issues)
2. Specific issues found with line numbers
3. Security vulnerabilities (if any)
4. Performance concerns
5. Concrete suggestions for improvement
6. Positive aspects of the code

Be constructive, specific, and actionable.`;

  const userPrompt = `Please review this ${request.language} code:

\`\`\`${request.language}
${request.code}
\`\`\``;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  const response = await model.invoke(messages);

  return {
    content: response.content as string,
    language: request.language,
  };
}

// ============================================
// EXAMPLE 3: Content Writer Agent
// ============================================

export interface ContentWriterRequest {
  topic: string;
  contentType: 'blog' | 'social' | 'email' | 'ad-copy' | 'product-description';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful';
  length?: 'short' | 'medium' | 'long';
  targetAudience?: string;
  keywords?: string[];
}

export async function contentWriterAgent(request: ContentWriterRequest) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.8, // Higher temperature for creative content
    maxTokens: 2000,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const tone = request.tone || 'professional';
  const length = request.length || 'medium';

  const lengthGuidelines = {
    short: '100-200 words',
    medium: '300-500 words',
    long: '800-1200 words',
  };

  const systemPrompt = `You are a professional content writer specializing in ${request.contentType}.

Writing Guidelines:
- Tone: ${tone}
- Length: ${lengthGuidelines[length]}
- Target Audience: ${request.targetAudience || 'General audience'}
${request.keywords ? `- SEO Keywords to include: ${request.keywords.join(', ')}` : ''}

Content Type Specific:
${request.contentType === 'blog' ? '- Use headings, subheadings, and bullet points\n- Include introduction, body, and conclusion\n- Make it engaging and informative' : ''}
${request.contentType === 'social' ? '- Hook readers in the first line\n- Use emojis appropriately\n- Include call-to-action' : ''}
${request.contentType === 'email' ? '- Clear subject line\n- Personalized greeting\n- Strong call-to-action\n- Professional closing' : ''}
${request.contentType === 'ad-copy' ? '- Attention-grabbing headline\n- Focus on benefits over features\n- Strong call-to-action\n- Create urgency' : ''}
${request.contentType === 'product-description' ? '- Highlight key features and benefits\n- Use sensory language\n- Address customer pain points\n- Include specifications' : ''}

Write compelling, original content that resonates with the target audience.`;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Write ${request.contentType} about: ${request.topic}`),
  ];

  const response = await model.invoke(messages);

  return {
    content: response.content as string,
    contentType: request.contentType,
    metadata: {
      wordCount: (response.content as string).split(' ').length,
      tone,
      keywords: request.keywords,
    },
  };
}

// ============================================
// EXAMPLE 4: Customer Support Agent with Tools
// ============================================

export interface SupportTicket {
  ticketId: string;
  customerName: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

// Simulated tool functions (replace with real API calls)
const supportTools = {
  checkOrderStatus: async (orderId: string) => {
    // Simulate API call
    return {
      orderId,
      status: 'Shipped',
      estimatedDelivery: '2025-11-12',
      trackingNumber: 'TRACK123456',
    };
  },

  searchKnowledgeBase: async (query: string) => {
    // Simulate knowledge base search
    return [
      { title: 'How to reset password', url: 'https://help.example.com/reset-password' },
      { title: 'Return policy', url: 'https://help.example.com/returns' },
    ];
  },

  createRefund: async (orderId: string, amount: number) => {
    // Simulate refund creation
    return {
      refundId: 'REF' + Date.now(),
      amount,
      status: 'Processing',
      estimatedDays: 5,
    };
  },
};

export async function customerSupportAgent(ticket: SupportTicket) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.5,
    maxTokens: 1500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const systemPrompt = `You are a customer support agent. Your goal is to help customers resolve their issues quickly and professionally.

Ticket Information:
- Ticket ID: ${ticket.ticketId}
- Customer: ${ticket.customerName}
- Priority: ${ticket.priority}
${ticket.category ? `- Category: ${ticket.category}` : ''}

Available Tools:
1. checkOrderStatus(orderId) - Check order status and tracking
2. searchKnowledgeBase(query) - Find help articles
3. createRefund(orderId, amount) - Process refunds

Guidelines:
- Be empathetic and understanding
- Provide clear, step-by-step solutions
- Use tools when appropriate
- Escalate urgent issues
- Always confirm customer satisfaction

Respond in a helpful, professional manner.`;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Customer Issue: ${ticket.issue}`),
  ];

  const response = await model.invoke(messages);

  // Here you could parse the response to detect tool calls
  // and execute them, then feed the results back to the agent

  return {
    content: response.content as string,
    ticketId: ticket.ticketId,
    priority: ticket.priority,
  };
}

// ============================================
// EXAMPLE 5: Multi-Agent System (Orchestrator)
// ============================================

export interface MultiAgentRequest {
  userRequest: string;
  availableAgents: string[]; // e.g., ['sales', 'support', 'technical']
}

export async function orchestratorAgent(request: MultiAgentRequest) {
  const model = new ChatOpenAI({
    modelName: 'glm-4.6',
    temperature: 0.3,
    maxTokens: 500,
    configuration: {
      baseURL: 'https://api.z.ai/api/paas/v4',
      apiKey: process.env.ZAI_API_KEY,
    },
  });

  const systemPrompt = `You are an orchestrator agent that routes user requests to specialized agents.

Available specialized agents:
${request.availableAgents.map(agent => `- ${agent}`).join('\n')}

Your job:
1. Analyze the user's request
2. Determine which specialized agent should handle it
3. Return ONLY the agent name (one word)

Examples:
- "I want to buy a laptop" → sales
- "My order hasn't arrived" → support
- "How do I integrate your API?" → technical
- "I need help analyzing data" → data-analyst`;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(request.userRequest),
  ];

  const response = await model.invoke(messages);
  const selectedAgent = (response.content as string).trim().toLowerCase();

  return {
    selectedAgent,
    originalRequest: request.userRequest,
    reasoning: `Routing to ${selectedAgent} agent`,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function clearAgentMemory(agentType: string, sessionId: string) {
  switch (agentType) {
    case 'sales':
      salesConversations.delete(sessionId);
      break;
    // Add other agents here
  }
}

export function getAgentMemory(agentType: string, sessionId: string) {
  switch (agentType) {
    case 'sales':
      return salesConversations.get(sessionId) || [];
    default:
      return [];
  }
}
