import { DollarSign, Package, Users, TrendingUp, Target, BarChart3, Loader2 } from 'lucide-react';

interface EcommerceAnalysisButtonsProps {
  onRunAnalysis: (type: string) => void;
  analyzing: boolean;
}

export function EcommerceAnalysisButtons({ onRunAnalysis, analyzing }: EcommerceAnalysisButtonsProps) {
  const analyses = [
    {
      type: 'ecommerce-revenue',
      name: 'Revenue Analytics',
      description: 'Total revenue, AOV, growth trends',
      icon: DollarSign,
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      shadow: 'shadow-green-500/40',
    },
    {
      type: 'ecommerce-products',
      name: 'Product Performance',
      description: 'Top sellers, profitability, inventory',
      icon: Package,
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
      shadow: 'shadow-blue-500/40',
    },
    {
      type: 'ecommerce-customers',
      name: 'Customer Analytics',
      description: 'CLV, retention, new vs returning',
      icon: Users,
      gradient: 'from-purple-500 via-pink-600 to-rose-600',
      shadow: 'shadow-purple-500/40',
    },
    {
      type: 'ecommerce-rfm',
      name: 'RFM Segmentation',
      description: 'Customer segments & targeting',
      icon: Target,
      gradient: 'from-yellow-500 via-orange-600 to-red-600',
      shadow: 'shadow-yellow-500/40',
    },
    {
      type: 'ecommerce-cohorts',
      name: 'Cohort Analysis',
      description: 'Customer retention by cohort',
      icon: BarChart3,
      gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
      shadow: 'shadow-cyan-500/40',
    },
    {
      type: 'ecommerce-forecast',
      name: 'Revenue Forecast',
      description: '30-day revenue prediction',
      icon: TrendingUp,
      gradient: 'from-indigo-500 via-purple-600 to-pink-600',
      shadow: 'shadow-indigo-500/40',
    },
  ];

  return (
    <div className="glass-dark rounded-3xl p-10 mb-10 glow-purple">
      <h2 className="text-3xl font-black text-white mb-4 flex items-center">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 mr-4 shadow-lg shadow-indigo-500/40">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <span className="gradient-text">E-Commerce Analytics</span>
      </h2>
      <p className="text-gray-400 mb-8 ml-20">
        Run specialized analyses designed for e-commerce data. Auto-detects columns like revenue, product, customer, and date.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((analysis) => {
          const Icon = analysis.icon;
          return (
            <button
              key={analysis.type}
              onClick={() => onRunAnalysis(analysis.type)}
              disabled={analyzing}
              className={`button-hover group relative px-6 py-5 bg-gradient-to-br ${analysis.gradient} text-white rounded-2xl hover:shadow-2xl shadow-lg ${analysis.shadow} disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none transition-all transform hover:scale-105 disabled:cursor-not-allowed overflow-hidden`}
            >
              <div className="relative z-10 flex items-start">
                <div className="bg-white bg-opacity-20 rounded-xl p-2.5 mr-3">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-lg mb-0.5">{analysis.name}</div>
                  <div className="text-xs opacity-90 font-medium">{analysis.description}</div>
                </div>
              </div>
              {analyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
