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
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <header className="glass-dark border-b border-white border-opacity-20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 float-animation">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl glow-purple">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Storn Analytics</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="glass-dark rounded-3xl p-8 hover-lift glow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-bold mb-2 uppercase tracking-wide">Total Datasets</p>
                <p className="text-5xl font-black text-gray-900 mb-2">{datasets.length}</p>
                <p className="text-gray-600 text-sm font-medium">Active projects</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl float-animation">
                <Database className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
          </div>

          <div className="glass-dark rounded-3xl p-8 hover-lift glow-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-bold mb-2 uppercase tracking-wide">Total Records</p>
                <p className="text-5xl font-black text-gray-900 mb-2">
                  {datasets.reduce((sum, d) => sum + d.rowCount, 0).toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm font-medium">Data points analyzed</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl float-animation" style={{animationDelay: '0.5s'}}>
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          </div>

          <div className="glass-dark rounded-3xl p-8 hover-lift glow-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-bold mb-2 uppercase tracking-wide">Analyses Run</p>
                <p className="text-5xl font-black text-gray-900 mb-2">
                  {datasets.reduce((sum, d) => sum + d._count.analyses, 0)}
                </p>
                <p className="text-gray-600 text-sm font-medium">Insights generated</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl float-animation" style={{animationDelay: '1s'}}>
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {datasets.map((dataset, index) => (
                <div
                  key={dataset.id}
                  className="glass-dark rounded-3xl overflow-hidden hover-lift group"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-3">
                          <Database className="w-7 h-7" />
                        </div>
                        <span className="text-xs bg-white bg-opacity-20 backdrop-blur-lg px-3 py-1 rounded-full font-medium">
                          {new Date(dataset.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black mb-2 truncate">{dataset.name}</h3>
                      <p className="text-indigo-100 text-sm truncate flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        {dataset.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                        <p className="text-xs text-blue-700 font-bold mb-1 uppercase">Rows</p>
                        <p className="text-2xl font-black text-blue-900">{dataset.rowCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                        <p className="text-xs text-purple-700 font-bold mb-1 uppercase">Columns</p>
                        <p className="text-2xl font-black text-purple-900">{dataset.columnCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <Link
                        href={`/dataset/${dataset.id}`}
                        className="button-hover flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => deleteDataset(dataset.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-bold transition-colors px-3 py-2 hover:bg-red-50 rounded-lg"
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
