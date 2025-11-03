'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Table2, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ColumnStat {
  column: string;
  type: string;
  count: number;
  unique: number;
  nullCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
}

interface Analysis {
  id: string;
  name: string;
  type: string;
  results: any;
  createdAt: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  uploadedAt: string;
  records: Array<{ data: any }>;
  analyses: Analysis[];
}

export default function DatasetPage() {
  const params = useParams();
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'stats' | 'correlations'>('data');

  useEffect(() => {
    fetchDataset();
  }, [params.id]);

  const fetchDataset = async () => {
    try {
      const res = await fetch(`/api/datasets/${params.id}`);
      const data = await res.json();
      setDataset(data);
    } catch (error) {
      console.error('Error fetching dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (type: string) => {
    setAnalyzing(true);
    try {
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: params.id,
          analysisType: type,
        }),
      });
      await fetchDataset();
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="glass-dark rounded-2xl p-8">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center glass-dark rounded-2xl p-8">
          <p className="text-gray-300 mb-4">Dataset not found</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const summaryAnalysis = dataset.analyses.find(a => a.type === 'summary');
  const columnStats: ColumnStat[] = summaryAnalysis?.results?.columnStats || [];
  const correlationAnalysis = dataset.analyses.find(a => a.type === 'correlation');

  return (
    <div className="min-h-screen animated-bg">
      <header className="glass-dark shadow-lg border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text">{dataset.name}</h1>
              {dataset.description && (
                <p className="text-gray-400 mt-2 text-lg">{dataset.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6 mt-6">
            <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-xl">
              <span className="text-blue-300 font-semibold">{dataset.rowCount.toLocaleString()}</span>
              <span className="text-blue-400 text-sm ml-1">rows</span>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-xl">
              <span className="text-purple-300 font-semibold">{dataset.columnCount}</span>
              <span className="text-purple-400 text-sm ml-1">columns</span>
            </div>
            <div className="bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-xl">
              <span className="text-gray-300 text-sm">{new Date(dataset.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Analysis Actions */}
        <div className="glass-dark rounded-3xl p-10 mb-10 glow-purple">
          <h2 className="text-3xl font-black text-white mb-8 flex items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 mr-4 shadow-lg shadow-indigo-500/40">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <span className="gradient-text">Run Advanced Analysis</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => runAnalysis('correlation')}
              disabled={analyzing}
              className="button-hover group relative px-8 py-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl shadow-lg shadow-indigo-500/40 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none transition-all transform hover:scale-105 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="relative z-10 flex items-start">
                <div className="bg-white bg-opacity-20 rounded-xl p-3 mr-4">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-xl mb-1">Correlation Analysis</div>
                  <div className="text-sm text-indigo-100 font-medium">Find relationships between variables</div>
                </div>
              </div>
              {analyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>
            <button
              onClick={() => runAnalysis('distribution')}
              disabled={analyzing}
              className="button-hover group relative px-8 py-6 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-2xl shadow-lg shadow-green-500/40 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none transition-all transform hover:scale-105 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="relative z-10 flex items-start">
                <div className="bg-white bg-opacity-20 rounded-xl p-3 mr-4">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-black text-xl mb-1">Distribution Analysis</div>
                  <div className="text-sm text-green-100 font-medium">Analyze data distribution patterns</div>
                </div>
              </div>
              {analyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-dark rounded-3xl overflow-hidden">
          <div className="border-b border-indigo-500/20">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('data')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'data'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <Table2 className="w-5 h-5 inline mr-2" />
                Data Preview
                {activeTab === 'data' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'stats'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Statistics
                {activeTab === 'stats' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('correlations')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'correlations'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Correlations
                {activeTab === 'correlations' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'data' && (
              <div className="overflow-x-auto">
                {dataset.records.length > 0 && (
                  <table className="min-w-full divide-y divide-indigo-500/20">
                    <thead className="bg-slate-800/50">
                      <tr>
                        {Object.keys(dataset.records[0].data as Record<string, any>).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-500/10">
                      {dataset.records.slice(0, 100).map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                          {Object.values(record.data as Record<string, any>).map((value: any, i) => (
                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {value?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {dataset.records.length > 100 && (
                  <p className="text-sm text-gray-400 mt-4">
                    Showing first 100 rows of {dataset.rowCount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                {columnStats.map((stat) => (
                  <div key={stat.column} className="border border-indigo-500/20 bg-slate-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {stat.column}
                      <span className="ml-2 text-sm font-normal text-gray-400">
                        ({stat.type})
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Count</p>
                        <p className="text-lg font-semibold text-blue-300">{stat.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Unique</p>
                        <p className="text-lg font-semibold text-purple-300">{stat.unique}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Null Count</p>
                        <p className="text-lg font-semibold text-gray-300">{stat.nullCount}</p>
                      </div>
                      {stat.type === 'numeric' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-400">Mean</p>
                            <p className="text-lg font-semibold text-green-300">{stat.mean?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Median</p>
                            <p className="text-lg font-semibold text-cyan-300">{stat.median?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Min</p>
                            <p className="text-lg font-semibold text-yellow-300">{stat.min?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Max</p>
                            <p className="text-lg font-semibold text-orange-300">{stat.max?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Std Dev</p>
                            <p className="text-lg font-semibold text-pink-300">{stat.stdDev?.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {stat.type === 'numeric' && (
                      <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={[
                              { name: 'Min', value: stat.min },
                              { name: 'Mean', value: stat.mean },
                              { name: 'Median', value: stat.median },
                              { name: 'Max', value: stat.max },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}} />
                            <Bar dataKey="value" fill="url(#colorGradient)" />
                            <defs>
                              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8}/>
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'correlations' && (
              <div>
                {correlationAnalysis ? (
                  <div className="space-y-4">
                    {correlationAnalysis.results.correlations.map((corr: any, idx: number) => (
                      <div key={idx} className="border border-indigo-500/20 bg-slate-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">
                              {corr.column1} ↔ {corr.column2}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{
                              color: corr.correlation > 0 ? '#4ade80' : '#f87171'
                            }}>
                              {corr.correlation.toFixed(3)}
                            </p>
                            <p className="text-sm text-gray-400">correlation</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full shadow-lg"
                              style={{
                                width: `${Math.abs(corr.correlation) * 100}%`,
                                backgroundColor: corr.correlation > 0 ? '#4ade80' : '#f87171',
                                boxShadow: corr.correlation > 0 ? '0 0 10px #4ade80' : '0 0 10px #f87171',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {correlationAnalysis.results.correlations.length === 0 && (
                      <p className="text-gray-400 text-center py-8">
                        No significant correlations found (threshold: 0.5)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No correlation analysis yet</p>
                    <button
                      onClick={() => runAnalysis('correlation')}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/40"
                    >
                      Run Correlation Analysis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
