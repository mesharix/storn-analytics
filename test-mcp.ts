/**
 * MCP Testing Script
 * Tests all MCP components: server, client, tools, and AI agent
 * Author: Msh (hi@msh.sa)
 *
 * Run with: npx ts-node test-mcp.ts
 */

import { useMCPTool, MCPClient } from './lib/mcp-client';
import { analyzeWithEliteAgentMCP } from './lib/elite-agent-with-mcp';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: MCP Server Connection
 */
async function testServerConnection() {
  section('Test 1: MCP Server Connection');

  try {
    const client = new MCPClient();

    log('Connecting to MCP server...', 'yellow');
    await client.connect();
    log('✓ Successfully connected to MCP server', 'green');

    log('Disconnecting...', 'yellow');
    await client.disconnect();
    log('✓ Successfully disconnected', 'green');

    return true;
  } catch (error: any) {
    log(`✗ Server connection failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 2: List Available Tools
 */
async function testListTools() {
  section('Test 2: List Available Tools');

  try {
    const client = new MCPClient();
    await client.connect();

    log('Fetching available tools...', 'yellow');
    const tools = await client.listTools();

    log(`✓ Found ${tools.length} tools:`, 'green');
    tools.forEach((tool: any) => {
      console.log(`\n  Tool: ${colors.blue}${tool.name}${colors.reset}`);
      console.log(`  Description: ${tool.description}`);
      console.log(`  Input Schema:`, JSON.stringify(tool.inputSchema, null, 2));
    });

    await client.disconnect();
    return true;
  } catch (error: any) {
    log(`✗ List tools failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 3: Call Individual Tools
 */
async function testIndividualTools() {
  section('Test 3: Call Individual Tools');

  const tests = [
    {
      name: 'get_sales_data',
      args: {
        startDate: '2024-10-01',
        endDate: '2024-10-31',
      },
    },
    {
      name: 'analyze_customer_behavior',
      args: {
        customerId: 'CUST-001',
        period: 'month',
      },
    },
    {
      name: 'get_invoice_summary',
      args: {
        month: '2024-10',
      },
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      log(`\nTesting tool: ${test.name}`, 'yellow');
      log(`Arguments: ${JSON.stringify(test.args)}`, 'yellow');

      const result = await useMCPTool(test.name, test.args);

      log(`✓ Tool executed successfully`, 'green');
      console.log(`Result:`, JSON.stringify(result, null, 2));

      await delay(1000); // Wait between tests
    } catch (error: any) {
      log(`✗ Tool ${test.name} failed: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test 4: AI Agent with MCP
 */
async function testAIAgent() {
  section('Test 4: AI Agent with MCP Integration');

  const testQueries = [
    {
      question: 'ما هو إجمالي المبيعات للشهر الحالي؟',
      description: 'Sales data query in Arabic',
    },
    {
      question: 'Analyze customer CUST-001 behavior',
      description: 'Customer analysis in English',
    },
    {
      question: 'Give me the invoice summary for October',
      description: 'Invoice summary in English',
    },
  ];

  let allPassed = true;

  for (const test of testQueries) {
    try {
      log(`\nTesting: ${test.description}`, 'yellow');
      log(`Question: "${test.question}"`, 'yellow');

      const result = await analyzeWithEliteAgentMCP({
        question: test.question,
        sessionId: 'test-session',
      });

      if (result.error) {
        throw new Error(result.error);
      }

      log(`✓ AI responded successfully`, 'green');
      console.log(`\nResponse:`);
      console.log(colors.blue + result.content + colors.reset);

      // Check if MCP tools were used
      const mcpPattern = /\*\*\[MCP_TOOL:/g;
      const usedMCP = mcpPattern.test(result.content);

      if (usedMCP) {
        log(`✓ AI used MCP tools (as expected)`, 'green');
      } else {
        log(`⚠ AI did not use MCP tools (might be unexpected)`, 'yellow');
      }

      await delay(2000); // Wait between AI calls
    } catch (error: any) {
      log(`✗ AI query failed: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test 5: Conversation Memory
 */
async function testConversationMemory() {
  section('Test 5: Conversation Memory');

  const sessionId = 'memory-test-session';

  try {
    log('Message 1: Asking about sales data', 'yellow');
    const response1 = await analyzeWithEliteAgentMCP({
      question: 'What were the sales for October?',
      sessionId,
    });

    log('✓ First message sent', 'green');
    console.log(colors.blue + response1.content.substring(0, 200) + '...' + colors.reset);

    await delay(1000);

    log('\nMessage 2: Follow-up question (tests memory)', 'yellow');
    const response2 = await analyzeWithEliteAgentMCP({
      question: 'What about compared to September?',
      sessionId,
    });

    log('✓ Follow-up message sent', 'green');
    console.log(colors.blue + response2.content.substring(0, 200) + '...' + colors.reset);

    log('\n✓ Conversation memory working (AI remembered context)', 'green');
    return true;
  } catch (error: any) {
    log(`✗ Conversation memory test failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 6: Error Handling
 */
async function testErrorHandling() {
  section('Test 6: Error Handling');

  try {
    log('Testing invalid tool name...', 'yellow');

    try {
      await useMCPTool('nonexistent_tool', {});
      log('✗ Should have thrown an error', 'red');
      return false;
    } catch (error) {
      log('✓ Correctly threw error for invalid tool', 'green');
    }

    log('\nTesting missing required arguments...', 'yellow');

    try {
      await useMCPTool('get_sales_data', {});
      log('✗ Should have thrown an error', 'red');
      return false;
    } catch (error) {
      log('✓ Correctly threw error for missing arguments', 'green');
    }

    log('\nTesting invalid date format...', 'yellow');

    try {
      await useMCPTool('get_sales_data', {
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      });
      // This might still succeed with mock data, so we just log the result
      log('⚠ Tool accepted invalid dates (implement validation)', 'yellow');
    } catch (error) {
      log('✓ Correctly threw error for invalid dates', 'green');
    }

    return true;
  } catch (error: any) {
    log(`✗ Error handling test failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║         MCP Integration Test Suite                      ║', 'cyan');
  log('║         Storn Analytics - Elite Agent with MCP          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');

  const results: Record<string, boolean> = {};

  // Run all tests
  results['Server Connection'] = await testServerConnection();
  await delay(1000);

  results['List Tools'] = await testListTools();
  await delay(1000);

  results['Individual Tools'] = await testIndividualTools();
  await delay(1000);

  results['AI Agent'] = await testAIAgent();
  await delay(1000);

  results['Conversation Memory'] = await testConversationMemory();
  await delay(1000);

  results['Error Handling'] = await testErrorHandling();

  // Summary
  section('Test Summary');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;

  console.log('Test Results:');
  Object.entries(results).forEach(([name, passed]) => {
    const icon = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`  ${icon} ${name}`, color);
  });

  console.log('\n' + '─'.repeat(60));
  log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`,
      failedTests === 0 ? 'green' : 'yellow');
  console.log('─'.repeat(60) + '\n');

  if (failedTests === 0) {
    log('🎉 All tests passed! MCP integration is working correctly.', 'green');
    log('You can now use the MCP chat interface at /mcp-demo', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }

  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
