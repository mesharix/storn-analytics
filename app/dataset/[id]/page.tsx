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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Dataset not found</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{dataset.name}</h1>
              {dataset.description && (
                <p className="text-gray-600 mt-2 text-lg">{dataset.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6 mt-6">
            <div className="bg-blue-50 px-4 py-2 rounded-xl">
              <span className="text-blue-900 font-semibold">{dataset.rowCount.toLocaleString()}</span>
              <span className="text-blue-600 text-sm ml-1">rows</span>
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded-xl">
              <span className="text-purple-900 font-semibold">{dataset.columnCount}</span>
              <span className="text-purple-600 text-sm ml-1">columns</span>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl">
              <span className="text-gray-700 text-sm">{new Date(dataset.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Analysis Actions */}
        <div className="glass-dark rounded-3xl p-10 mb-10 glow-purple">
          <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-3 mr-4 glow-purple">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <span className="gradient-text">Run Advanced Analysis</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => runAnalysis('correlation')}
              disabled={analyzing}
              className="button-hover group relative px-8 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-xl transform hover:scale-105 disabled:cursor-not-allowed overflow-hidden"
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
                <div className="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>
            <button
              onClick={() => runAnalysis('distribution')}
              disabled={analyzing}
              className="button-hover group relative px-8 py-6 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white rounded-2xl hover:shadow-2xl disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-xl transform hover:scale-105 disabled:cursor-not-allowed overflow-hidden"
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
                <div className="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-dark rounded-3xl overflow-hidden">
          <div className="border-b-2 border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('data')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'data'
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Table2 className="w-5 h-5 inline mr-2" />
                Data Preview
                {activeTab === 'data' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'stats'
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Statistics
                {activeTab === 'stats' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('correlations')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'correlations'
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Correlations
                {activeTab === 'correlations' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'data' && (
              <div className="overflow-x-auto">
                {dataset.records.length > 0 && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(dataset.records[0].data as Record<string, any>).map((key) => (
                          <th
                            key={key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dataset.records.slice(0, 100).map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {Object.values(record.data as Record<string, any>).map((value: any, i) => (
                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {value?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {dataset.records.length > 100 && (
                  <p className="text-sm text-gray-500 mt-4">
                    Showing first 100 rows of {dataset.rowCount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                {columnStats.map((stat) => (
                  <div key={stat.column} className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {stat.column}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({stat.type})
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Count</p>
                        <p className="text-lg font-semibold">{stat.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Unique</p>
                        <p className="text-lg font-semibold">{stat.unique}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Null Count</p>
                        <p className="text-lg font-semibold">{stat.nullCount}</p>
                      </div>
                      {stat.type === 'numeric' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Mean</p>
                            <p className="text-lg font-semibold">{stat.mean?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Median</p>
                            <p className="text-lg font-semibold">{stat.median?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Min</p>
                            <p className="text-lg font-semibold">{stat.min?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Max</p>
                            <p className="text-lg font-semibold">{stat.max?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Std Dev</p>
                            <p className="text-lg font-semibold">{stat.stdDev?.toFixed(2)}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {stat.type === 'numeric' && (
                      <div className="mt-6">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={[
                              { name: 'Min', value: stat.min },
                              { name: 'Mean', value: stat.mean },
                              { name: 'Median', value: stat.median },
                              { name: 'Max', value: stat.max },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4f46e5" />
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
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {corr.column1} ↔ {corr.column2}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{
                              color: corr.correlation > 0 ? '#16a34a' : '#dc2626'
                            }}>
                              {corr.correlation.toFixed(3)}
                            </p>
                            <p className="text-sm text-gray-500">correlation</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.abs(corr.correlation) * 100}%`,
                                backgroundColor: corr.correlation > 0 ? '#16a34a' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {correlationAnalysis.results.correlations.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        No significant correlations found (threshold: 0.5)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No correlation analysis yet</p>
                    <button
                      onClick={() => runAnalysis('correlation')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
