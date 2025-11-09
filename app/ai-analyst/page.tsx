'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Upload, FileUp, Download, ArrowLeft, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAnalystPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm a Data Analysis AI Agent developed by **Msh**.\n\nUpload your data file (CSV, XLSX, XLS) to get started.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session-${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Download analysis as markdown file
  const downloadAnalysis = () => {
    if (!analysisResult || !uploadedFileName) return;

    const blob = new Blob([analysisResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uploadedFileName}_analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download data as CSV
  const downloadData = () => {
    if (!uploadedData || uploadedData.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(uploadedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${uploadedFileName}_data.csv`);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      alert('Please upload a CSV, XLSX, or XLS file');
      return;
    }

    setUploadedFileName(fileName);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let parsedData: any[] = [];

        if (fileExtension === 'csv') {
          const text = data as string;
          const workbook = XLSX.read(text, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        setUploadedData(parsedData);

        const userMessage: Message = {
          role: 'user',
          content: `📊 Analyzing: ${fileName} (${parsedData.length} rows)`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        await analyzeData(parsedData, `Analyze this ${fileName} dataset with ${parsedData.length} rows. Provide comprehensive insights with statistical analysis.`);
      } catch (error) {
        console.error('File parse error:', error);
        alert('Error parsing file. Please check the file format.');
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const analyzeData = async (data: any[], question: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/elite-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          question,
          sessionId: sessionId.current,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.analysis,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setAnalysisResult(result.analysis);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Error analyzing data. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error analyzing data. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/elite-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          question: input,
          sessionId: sessionId.current,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.analysis,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (result.analysis) {
          setAnalysisResult((prev) => prev + '\n\n---\n\n' + result.analysis);
        }
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Error processing request. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error processing request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const clearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: "👋 Hi! I'm a Data Analysis AI Agent developed by **Msh**.\n\nUpload your data file (CSV, XLSX, XLS) to get started.",
        timestamp: new Date(),
      },
    ]);
    setUploadedData(null);
    setUploadedFileName('');
    setAnalysisResult('');
    sessionId.current = `session-${Date.now()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Data Analyst</h1>
                <p className="text-sm text-slate-400">Developed by Msh (hi@msh.sa)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {uploadedData && (
              <>
                <button
                  onClick={downloadData}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Data
                </button>
                <button
                  onClick={downloadAnalysis}
                  disabled={!analysisResult}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download Analysis
                </button>
              </>
            )}
            <button
              onClick={clearConversation}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* Messages Section */}
          <div className="flex-1 flex flex-col bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            {isDragging && (
              <div className="absolute inset-0 bg-indigo-600/95 z-10 flex items-center justify-center backdrop-blur-md rounded-2xl">
                <div className="text-center">
                  <FileUp className="w-20 h-20 text-white mx-auto mb-6 animate-bounce" />
                  <p className="text-white text-3xl font-bold mb-2">Drop your data file</p>
                  <p className="text-indigo-200 text-lg">CSV, XLSX, or XLS</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-8 space-y-6"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-700/80 backdrop-blur-sm text-slate-100 border border-slate-600/50'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-invert prose-lg max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            code: ({ children }) => (
                              <code className="bg-slate-800/80 px-2 py-1 rounded text-indigo-300 text-sm">
                                {children}
                              </code>
                            ),
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-slate-200">{children}</h3>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed">{message.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/80 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 border border-slate-600/50">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span className="text-base text-slate-300">Analyzing data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50">
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded-xl px-6 py-3 flex items-center justify-center gap-3 transition-colors border border-slate-600/50 hover:border-indigo-500/50"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Data File (CSV, XLSX, XLS)</span>
                </button>
                {uploadedFileName && (
                  <p className="text-sm text-green-400 mt-2 text-center font-medium">
                    ✓ {uploadedFileName} loaded
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask questions about your data..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-700/80 text-white text-base rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 placeholder-slate-400 border border-slate-600/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-8 py-4 hover:shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Drag & drop files anywhere • Press Enter to send
              </p>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="w-80 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Quick Guide</h3>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
                <h4 className="font-semibold text-indigo-300 mb-2">📤 Upload Data</h4>
                <p className="text-sm text-slate-300">
                  Drag & drop or click to upload CSV, XLSX, or XLS files
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
                <h4 className="font-semibold text-purple-300 mb-2">🐍 Python Analysis</h4>
                <p className="text-sm text-slate-300">
                  AI uses Python with NumPy, Pandas, Matplotlib for deep analysis
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
                <h4 className="font-semibold text-green-300 mb-2">💾 Download</h4>
                <p className="text-sm text-slate-300">
                  Download analysis as markdown or data as CSV
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
                <h4 className="font-semibold text-blue-300 mb-2">💬 Ask Questions</h4>
                <p className="text-sm text-slate-300">
                  Follow-up with specific questions about your data
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 text-center">
                Developed by <span className="text-indigo-400 font-semibold">Msh</span>
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                hi@msh.sa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
