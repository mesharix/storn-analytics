'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Table2, BarChart3, ArrowLeft, RefreshCw } from 'lucide-react';

interface DatabaseInfo {
  summary: {
    totalDatasets: number;
    totalRecords: number;
    totalAnalyses: number;
  };
  datasets: Array<{
    id: string;
    name: string;
    description: string | null;
    rowCount: number;
    columnCount: number;
    recordsInDB: number;
    analysesCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    name: string;
    type: string;
    datasetName: string;
    createdAt: string;
  }>;
}

export default function DatabaseAdminPage() {
  const [data, setData] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/database');
      if (!response.ok) {
        throw new Error('Failed to fetch database info');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading database info...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-indigo-400" />
              <h1 className="text-4xl font-bold text-white">Database Viewer</h1>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-300">Total Datasets</h3>
              <Table2 className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-white">{data.summary.totalDatasets}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-green-300">Total Records</h3>
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-4xl font-bold text-white">{data.summary.totalRecords.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-purple-300">Total Analyses</h3>
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-4xl font-bold text-white">{data.summary.totalAnalyses}</p>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Table2 className="w-6 h-6 mr-2 text-indigo-400" />
            All Datasets
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-indigo-500/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Description</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Rows</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Columns</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Records in DB</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-semibold">Analyses</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.datasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/dataset/${dataset.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                        {dataset.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{dataset.description || '-'}</td>
                    <td className="py-3 px-4 text-right text-white font-mono">{dataset.rowCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white font-mono">{dataset.columnCount}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${dataset.recordsInDB === dataset.rowCount ? 'text-green-400' : 'text-yellow-400'}`}>
                        {dataset.recordsInDB.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-purple-400 font-mono">{dataset.analysesCount}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(dataset.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-400" />
            Recent Analyses
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-indigo-500/20">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Analysis Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Dataset</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{analysis.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                        {analysis.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{analysis.datasetName}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(analysis.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
