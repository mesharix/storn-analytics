# Elite Data Analysis Agent - Usage Guide

Your elite data analyst is ready! Here's how to use it.

## API Endpoint

```
POST http://localhost:3000/api/elite-analyst
```

---

## Example 1: Analyze JSON Data

```bash
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "sales": [
        {"month": "Jan", "revenue": 45000, "customers": 120},
        {"month": "Feb", "revenue": 52000, "customers": 145},
        {"month": "Mar", "revenue": 48000, "customers": 130},
        {"month": "Apr", "revenue": 61000, "customers": 170}
      ]
    },
    "question": "What are the key trends in sales performance? Are there any concerning patterns?",
    "context": "This is Q1 2024 sales data for our e-commerce platform",
    "sessionId": "user123"
  }'
```

**Response:**
```json
{
  "success": true,
  "analysis": "## Executive Summary\n1. Strong growth trend: +35% revenue increase from Jan to Apr...",
  "action": "analyze"
}
```

---

## Example 2: Analyze Array Data (CSV-like)

```bash
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"user_id": 1, "age": 25, "purchases": 5, "revenue": 450},
      {"user_id": 2, "age": 34, "purchases": 12, "revenue": 1200},
      {"user_id": 3, "age": 29, "purchases": 3, "revenue": 180},
      {"user_id": 4, "age": 42, "purchases": 18, "revenue": 2400}
    ],
    "question": "Analyze user behavior patterns. Which segments are most valuable?",
    "sessionId": "analyst-session-1"
  }'
```

---

## Example 3: Follow-Up Question (Uses Memory!)

```bash
# First analysis
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"product": "Laptop", "sold": 45}, {"product": "Phone", "sold": 120}],
    "question": "Which product is performing better?",
    "sessionId": "session-abc"
  }'

# Follow-up question (remembers the previous analysis!)
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "question": "Can you explain why that product is selling better?",
    "sessionId": "session-abc"
  }'
```

---

## Example 4: Analyze Text/CSV Data

```bash
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Date,Revenue,Customers\n2024-01-01,45000,120\n2024-01-02,52000,145\n2024-01-03,48000,130",
    "question": "Analyze the daily trends",
    "context": "Daily sales data for first 3 days of January 2024"
  }'
```

---

## Example 5: No Data, Just Question

```bash
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What statistical tests should I use to compare conversion rates between two marketing campaigns?",
    "sessionId": "consultant-1"
  }'
```

---

## Example 6: Clear Conversation Memory

```bash
curl -X POST http://localhost:3000/api/elite-analyst \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clear",
    "sessionId": "user123"
  }'
```

---

## Frontend Usage (JavaScript/TypeScript)

### Analyze Data

```typescript
const response = await fetch('/api/elite-analyst', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      sales: [
        { month: 'Jan', revenue: 45000 },
        { month: 'Feb', revenue: 52000 },
      ],
    },
    question: 'What are the trends?',
    context: 'Q1 2024 sales',
    sessionId: 'user-456',
  }),
});

const result = await response.json();
console.log(result.analysis); // The AI's detailed analysis
```

### Follow-Up Chat

```typescript
const followUp = await fetch('/api/elite-analyst', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'chat',
    question: 'Can you segment this by region?',
    sessionId: 'user-456',
  }),
});

const result = await followUp.json();
console.log(result.analysis);
```

### Clear Memory

```typescript
await fetch('/api/elite-analyst', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'clear',
    sessionId: 'user-456',
  }),
});
```

---

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | any | No | Your dataset (JSON, array, CSV text, etc.) |
| `question` | string | Yes | The analysis question |
| `context` | string | No | Business context for the analysis |
| `sessionId` | string | No | For conversation memory (default: 'default') |
| `action` | string | No | 'analyze' (default), 'chat', or 'clear' |

---

## Response Structure

### Success Response

```json
{
  "success": true,
  "analysis": "## Executive Summary\n\n1. Key finding...",
  "action": "analyze"
}
```

### Error Response

```json
{
  "error": "Failed to analyze data",
  "details": "Specific error message"
}
```

---

## What Makes This Agent Elite?

1. **Comprehensive Analysis**: Follows structured process (data understanding → analysis → insights → recommendations)
2. **Statistical Rigor**: Applies proper statistical methods and tests
3. **Business Focus**: Translates technical findings into actionable insights
4. **Memory**: Remembers previous analyses for contextual follow-ups
5. **Critical Thinking**: Questions assumptions, checks for biases, considers alternatives
6. **Clear Communication**: Structured output with executive summary, evidence, and recommendations

---

## Tips for Best Results

1. **Provide Context**: Tell the agent why you're analyzing the data
   ```json
   "context": "This is customer churn data. We need to reduce churn by 10% this quarter."
   ```

2. **Be Specific**: Ask focused questions
   - ✅ Good: "What factors correlate with high customer churn?"
   - ❌ Vague: "Tell me about this data"

3. **Use Follow-Ups**: The agent remembers, so ask follow-up questions
   - First: "Analyze these sales trends"
   - Follow-up: "Can you segment by region?"
   - Follow-up: "What's driving the difference between regions?"

4. **Include Data Context**: Mention what the data represents
   ```json
   "context": "Monthly active users for our mobile app, Jan-Dec 2024"
   ```

5. **Ask for Specific Outputs**: Request what you need
   - "What visualizations would best show this?"
   - "What statistical tests should I run?"
   - "What are the top 3 actionable recommendations?"

---

## Real-World Use Cases

### 1. Sales Performance Analysis
```json
{
  "data": [...],
  "question": "Why did sales drop in Q3? What factors contributed?",
  "context": "Sales data across 5 regions, multiple product lines"
}
```

### 2. Customer Segmentation
```json
{
  "data": [...],
  "question": "Segment customers by behavior and identify high-value segments",
  "context": "E-commerce customer data with purchase history"
}
```

### 3. A/B Test Analysis
```json
{
  "data": [...],
  "question": "Did variant B perform significantly better? What's the confidence level?",
  "context": "Email campaign A/B test results, 10,000 users each group"
}
```

### 4. Anomaly Detection
```json
{
  "data": [...],
  "question": "Identify any unusual patterns or outliers in the data",
  "context": "Daily transaction data for fraud detection"
}
```

### 5. Forecasting
```json
{
  "data": [...],
  "question": "Based on historical trends, what should we expect for next quarter?",
  "context": "3 years of monthly revenue data"
}
```

---

## Advanced: Using in Your Existing Data Analysis Flow

```typescript
// In your data analysis component
async function analyzeDataset(dataset: any[], userQuestion: string) {
  const response = await fetch('/api/elite-analyst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: dataset,
      question: userQuestion,
      context: `Dataset contains ${dataset.length} records`,
      sessionId: getUserSessionId(), // Your session management
    }),
  });

  const result = await response.json();

  if (result.success) {
    return result.analysis; // Display to user
  } else {
    throw new Error(result.error);
  }
}
```

---

## Source Code

- Agent: [lib/elite-data-agent.ts](lib/elite-data-agent.ts)
- API: [app/api/elite-analyst/route.ts](app/api/elite-analyst/route.ts)

Your elite data analyst is ready to provide world-class insights! 🚀
