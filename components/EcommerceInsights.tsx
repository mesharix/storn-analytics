// E-Commerce Insights Display Components
import { DollarSign, TrendingUp, Users, Package, Target, Calendar } from 'lucide-react';

interface EcommerceInsightsProps {
  analysis: any;
}

export function EcommerceInsights({ analysis }: EcommerceInsightsProps) {
  const { type, results } = analysis;

  if (results.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400">{results.error}</p>
        <p className="text-red-300 text-sm mt-2">
          Make sure your dataset has the right columns for e-commerce analysis.
        </p>
      </div>
    );
  }

  switch (type) {
    case 'ecommerce-revenue':
      return <RevenueInsights results={results} />;
    case 'ecommerce-products':
      return <ProductInsights results={results} />;
    case 'ecommerce-rfm':
      return <RFMInsights results={results} />;
    case 'ecommerce-customers':
      return <CustomerInsights results={results} />;
    case 'ecommerce-cohorts':
      return <CohortInsights results={results} />;
    case 'ecommerce-forecast':
      return <ForecastInsights results={results} />;
    default:
      return null;
  }
}

// Revenue Analytics Display
function RevenueInsights({ results }: { results: any }) {
  const { metrics, trends } = results;

  return (
    <div className="space-y-4">
      {/* Revenue Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-300">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">${metrics.totalRevenue}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-300">Total Orders</span>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-300">Avg Order Value</span>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">${metrics.averageOrderValue}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-300">Growth Rate</span>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">{trends.growthRate}</p>
          <p className={`text-xs mt-1 ${
            trends.direction === 'increasing' ? 'text-green-400' :
            trends.direction === 'decreasing' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {trends.direction}
          </p>
        </div>
      </div>

      {/* Revenue Trends */}
      {trends.trends && trends.trends.length > 0 && (
        <div className="bg-slate-900/50 p-4 rounded-lg">
          <h4 className="text-white font-semibold mb-3">Revenue Trend (Last 30 Days)</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {trends.trends.slice(-10).reverse().map((trend: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-gray-400 text-sm">{trend.date}</span>
                <span className="text-white font-mono font-semibold">${trend.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Product Performance Display
function ProductInsights({ results }: { results: any }) {
  const { topProducts, bottomProducts, totalProducts } = results;

  return (
    <div className="space-y-4">
      <p className="text-gray-300">
        Analyzed <span className="font-bold text-indigo-400">{totalProducts}</span> products
      </p>

      {/* Top Products */}
      <div className="bg-slate-900/50 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
          Top 10 Products by Revenue
        </h4>
        <div className="space-y-2">
          {topProducts.map((product: any, idx: number) => (
            <div key={idx} className="bg-slate-800/50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-medium">#{idx + 1} {product.product}</span>
                <span className="text-green-400 font-bold text-lg">${product.revenue}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Orders:</span>
                  <span className="text-white ml-1 font-semibold">{product.orders}</span>
                </div>
                <div>
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-white ml-1 font-semibold">{product.quantity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Price:</span>
                  <span className="text-white ml-1 font-semibold">${product.averagePrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// RFM Customer Segmentation Display
function RFMInsights({ results }: { results: any }) {
  const { segmentCounts, totalCustomers, customers } = results;

  const segmentColors: Record<string, string> = {
    'Champions': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
    'Loyal Customers': 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    'Big Spenders': 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    'New Customers': 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    'At Risk': 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
    'Lost Customers': 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
    'Other': 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-400',
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300">
        Segmented <span className="font-bold text-indigo-400">{totalCustomers}</span> customers into {Object.keys(segmentCounts).length} segments
      </p>

      {/* Segment Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(segmentCounts).map(([segment, count]: [string, any]) => (
          <div key={segment} className={`bg-gradient-to-br ${segmentColors[segment] || segmentColors['Other']} border rounded-xl p-4`}>
            <h4 className="font-semibold text-sm mb-1">{segment}</h4>
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-xs opacity-80 mt-1">
              {((count / totalCustomers) * 100).toFixed(1)}% of customers
            </p>
          </div>
        ))}
      </div>

      {/* Sample Customers */}
      <div className="bg-slate-900/50 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Sample Customers by Segment</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {customers.slice(0, 20).map((customer: any, idx: number) => (
            <div key={idx} className="bg-slate-800/50 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-medium">{customer.customer}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  customer.segment === 'Champions' ? 'bg-yellow-500/20 text-yellow-400' :
                  customer.segment === 'Loyal Customers' ? 'bg-green-500/20 text-green-400' :
                  customer.segment === 'At Risk' ? 'bg-orange-500/20 text-orange-400' :
                  customer.segment === 'Lost Customers' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {customer.segment}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Recency:</span>
                  <span className="text-white ml-1 font-semibold">{customer.recency}d</span>
                </div>
                <div>
                  <span className="text-gray-400">Frequency:</span>
                  <span className="text-white ml-1 font-semibold">{customer.frequency}</span>
                </div>
                <div>
                  <span className="text-gray-400">Monetary:</span>
                  <span className="text-white ml-1 font-semibold">${customer.monetary}</span>
                </div>
                <div>
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white ml-1 font-semibold">{customer.rScore}{customer.fScore}{customer.mScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Customer Analytics Display
function CustomerInsights({ results }: { results: any }) {
  return (
    <div className="space-y-4">
      {/* Customer Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-300">Total Customers</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{results.totalCustomers}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-300">New Customers</span>
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{results.newCustomers}</p>
          <p className="text-xs text-green-400 mt-1">{results.newCustomerPercent}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-300">Returning</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{results.returningCustomers}</p>
          <p className="text-xs text-purple-400 mt-1">{results.returningCustomerPercent}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-300">Avg CLV</span>
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">${results.averageCLV}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4 col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-300">Repeat Purchase Rate</span>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">{results.repeatPurchaseRate}</p>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-slate-900/50 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Top 10 Customers by Revenue</h4>
        <div className="space-y-2">
          {results.topCustomers.map((customer: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
              <div>
                <span className="text-white font-medium">#{idx + 1} {customer.customer}</span>
                <span className="text-gray-400 text-sm ml-3">{customer.orders} orders</span>
              </div>
              <span className="text-green-400 font-bold">${customer.revenue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Cohort Analysis Display
function CohortInsights({ results }: { results: any }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-300">
        Analyzed <span className="font-bold text-indigo-400">{results.totalCohorts}</span> customer cohorts
      </p>

      <div className="bg-slate-900/50 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Cohort Performance (Last 12 Months)</h4>
        <div className="space-y-2">
          {results.cohorts.map((cohort: any, idx: number) => (
            <div key={idx} className="bg-slate-800/50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-indigo-400 mr-2" />
                  <span className="text-white font-medium">{cohort.cohort}</span>
                </div>
                <span className="text-green-400 font-bold">${cohort.revenue}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Customers:</span>
                  <span className="text-white ml-1 font-semibold">{cohort.customers}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg per Customer:</span>
                  <span className="text-white ml-1 font-semibold">${cohort.avgRevenuePerCustomer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Revenue Forecast Display
function ForecastInsights({ results }: { results: any }) {
  if (results.error) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
        <p className="text-orange-400">{results.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-indigo-300">Forecast Trend</span>
          <TrendingUp className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-xl font-bold text-white capitalize">{results.trend}</p>
        <p className="text-indigo-400 text-sm mt-1">Growth Rate: {results.growthRate}</p>
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">30-Day Revenue Forecast</h4>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {results.forecast.map((day: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-gray-400 text-sm">{day.date}</span>
              <span className="text-indigo-400 font-mono font-semibold">${day.predictedRevenue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
