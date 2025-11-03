'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Database, BarChart3, TrendingUp } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  uploadedAt: string;
  _count: {
    records: number;
    analyses: number;
  };
}

export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDatasets(data);
      } else {
        console.error('Invalid response:', data);
        setDatasets([]);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;

    try {
      await fetch(`/api/datasets?id=${id}`, { method: 'DELETE' });
      fetchDatasets();
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Storn Analytics</h1>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="w-10 h-10 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Datasets</p>
                <p className="text-2xl font-bold text-gray-900">{datasets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-10 h-10 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {datasets.reduce((sum, d) => sum + d.rowCount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="w-10 h-10 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Analyses Run</p>
                <p className="text-2xl font-bold text-gray-900">
                  {datasets.reduce((sum, d) => sum + d._count.analyses, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Datasets</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading datasets...</div>
          ) : datasets.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No datasets yet</p>
              <Link
                href="/upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Dataset
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Columns
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{dataset.fileName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{dataset.rowCount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{dataset.columnCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(dataset.uploadedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dataset/${dataset.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteDataset(dataset.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
