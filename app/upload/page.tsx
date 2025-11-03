'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Upload, ArrowLeft, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/upload');
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center glass-dark rounded-2xl p-8">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the form if not authenticated
  if (!session) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      router.push(`/dataset/${data.dataset.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg">
      <header className="glass-dark border-b border-indigo-500 border-opacity-20">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold gradient-text">Upload Dataset</h1>
          <p className="text-gray-400 mt-2">Transform your data into actionable insights</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-dark rounded-3xl p-10 glow-purple">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <div className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                file
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/5'
              }`}>
                <div className="space-y-2 text-center">
                  <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors shadow-lg ${
                    file ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40' : 'bg-slate-700/50 shadow-slate-900/40'
                  }`}>
                    <FileSpreadsheet className={`w-8 h-8 ${file ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV, XLSX, XLS up to 10MB</p>
                  {file && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded-lg shadow-sm border border-indigo-500/30">
                      <p className="text-sm text-indigo-300 font-medium">
                        <span className="text-green-400">✓</span> {file.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dataset Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Dataset Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500"
                placeholder="My Dataset"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500"
                placeholder="Describe your dataset..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/"
                className="px-6 py-3 border-2 border-slate-600 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-all font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all inline-flex items-center shadow-lg shadow-indigo-500/40 transform hover:scale-105 font-semibold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Dataset
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 glass-dark border border-indigo-500/30 rounded-2xl p-8 shadow-lg glow-blue">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-3 shadow-lg shadow-blue-500/40">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-blue-300 mb-3">Supported File Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-3 shadow-sm">
                  <p className="font-semibold text-blue-300">CSV</p>
                  <p className="text-xs text-gray-400">Comma-Separated Values</p>
                </div>
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-3 shadow-sm">
                  <p className="font-semibold text-blue-300">XLSX</p>
                  <p className="text-xs text-gray-400">Excel 2007+</p>
                </div>
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-3 shadow-sm">
                  <p className="font-semibold text-blue-300">XLS</p>
                  <p className="text-xs text-gray-400">Excel 97-2003</p>
                </div>
              </div>
              <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                <p className="text-sm text-gray-300 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Your data will be automatically analyzed for statistics, correlations, and distributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
