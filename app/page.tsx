'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Database, BarChart3, TrendingUp, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

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
  const { data: session, status } = useSession();
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
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link
                    href="/upload"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Data
                  </Link>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Datasets</p>
                <p className="text-4xl font-bold text-white">{datasets.length}</p>
                <p className="text-blue-100 text-xs mt-2">Active projects</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-3">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Records</p>
                <p className="text-4xl font-bold text-white">
                  {datasets.reduce((sum, d) => sum + d.rowCount, 0).toLocaleString()}
                </p>
                <p className="text-green-100 text-xs mt-2">Data points analyzed</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Analyses Run</p>
                <p className="text-4xl font-bold text-white">
                  {datasets.reduce((sum, d) => sum + d._count.analyses, 0)}
                </p>
                <p className="text-purple-100 text-xs mt-2">Insights generated</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-3">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Datasets List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Datasets</h2>
            {datasets.length > 0 && session && (
              <Link
                href="/upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-pulse text-gray-400">Loading datasets...</div>
            </div>
          ) : datasets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="bg-indigo-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Database className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No datasets yet</h3>
              <p className="text-gray-600 mb-6">Get started by uploading your first dataset</p>
              {session ? (
                <Link
                  href="/upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your First Dataset
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 text-sm">Sign in to start uploading datasets</p>
                  <div className="flex items-center justify-center space-x-4">
                    <Link
                      href="/login"
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Database className="w-8 h-8 opacity-80" />
                      <span className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        {new Date(dataset.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 truncate">{dataset.name}</h3>
                    <p className="text-indigo-100 text-sm truncate">{dataset.fileName}</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">Rows</p>
                        <p className="text-lg font-bold text-blue-900">{dataset.rowCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-600 font-medium mb-1">Columns</p>
                        <p className="text-lg font-bold text-purple-900">{dataset.columnCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Link
                        href={`/dataset/${dataset.id}`}
                        className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => deleteDataset(dataset.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
