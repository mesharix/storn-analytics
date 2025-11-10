/**
 * MCP Demo Page
 * Showcases Elite Agent with MCP tools in action
 * Author: Msh (hi@msh.sa)
 */

import MCPChat from '@/app/components/MCPChat';

export const metadata = {
  title: 'MCP Demo - Elite Agent',
  description: 'AI-powered data analysis with Model Context Protocol',
};

export default function MCPDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Elite Data Agent with MCP
          </h1>
          <p className="text-lg text-gray-600">
            محلل البيانات الذكي مع بروتوكول MCP
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              z.ai GLM-4.6
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              Model Context Protocol
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
              Real-time Database
            </span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Sales Analysis</h3>
            <p className="text-sm text-gray-600">
              احصل على تحليل فوري لبيانات المبيعات من قاعدة البيانات
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">👥 Customer Insights</h3>
            <p className="text-sm text-gray-600">
              تحليل سلوك العملاء وتوقع معدل التسرب
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">📄 Invoice Summary</h3>
            <p className="text-sm text-gray-600">
              ملخص الفواتير الآلي للمحاسبة والضريبة
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <MCPChat />

        {/* Example Queries */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            أمثلة على الأسئلة التي يمكنك طرحها:
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-700">• "أعطني ملخص المبيعات للشهر الحالي"</p>
              <p className="text-gray-700">• "ما هي أكثر المنتجات مبيعاً في أكتوبر؟"</p>
              <p className="text-gray-700">• "قارن مبيعات سبتمبر بأكتوبر"</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">• "حلل سلوك العميل CUST-001"</p>
              <p className="text-gray-700">• "أعطني ملخص الفواتير لهذا الشهر"</p>
              <p className="text-gray-700">• "ما هو معدل الطلب للأسبوع الماضي؟"</p>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            🔧 Technical Architecture
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>AI Model:</strong> z.ai GLM-4.6 (Chinese model optimized for Arabic)
            </p>
            <p>
              <strong>Protocol:</strong> Model Context Protocol (MCP) by Anthropic
            </p>
            <p>
              <strong>Database:</strong> Supabase PostgreSQL
            </p>
            <p>
              <strong>Tools:</strong> get_sales_data, analyze_customer_behavior, get_invoice_summary
            </p>
            <p>
              <strong>Framework:</strong> Next.js 14 + LangChain
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Built by{' '}
            <a
              href="mailto:hi@msh.sa"
              className="text-blue-600 hover:underline"
            >
              Msh (hi@msh.sa)
            </a>{' '}
            | Powered by{' '}
            <a
              href="https://z.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              z.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
