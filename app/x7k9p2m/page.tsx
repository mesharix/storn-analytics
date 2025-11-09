'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Trash2, Image as ImageIcon, X, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
}

interface JournalEntry {
  invoiceNumber: string;
  date: string;
  supplier: string;
  entries: Array<{
    accountNumber: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  total: number;
}

export default function PrivateAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك المحاسبي الذكي.\n\nHello! I\'m your AI Accounting Assistant.\n\n📋 I can help you with:\n• Invoice analysis and validation\n• Journal entries generation\n• VAT compliance checking\n• Saudi accounting standards (ZATCA, SOCPA)\n\nUpload invoice images or ask me anything about accounting!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [processedInvoicesCount, setProcessedInvoicesCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`private-${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64Images = await Promise.all(imagePromises);
      setUploadedImages((prev) => [...prev, ...base64Images]);
    } catch (error) {
      console.error('Error reading images:', error);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Parse journal entries from AI response
  const parseAndStoreJournalEntries = (content: string, invoiceCount: number) => {
    // Update processed invoices count
    setProcessedInvoicesCount((prev) => prev + invoiceCount);

    // Store the raw content for later parsing when downloading
    // For now, we'll just count the invoices
  };

  // Parse accounting entries from AI response
  const parseJournalEntry = (content: string) => {
    const entries: any[] = [];

    // Extract invoice summary data
    const invoiceNumberMatch = content.match(/رقم الفاتورة[:\s]+([^\n]+)/i) || content.match(/Invoice Number[:\s]+([^\n]+)/i);
    const dateMatch = content.match(/التاريخ[:\s]+([^\n]+)/i) || content.match(/Date[:\s]+([0-9\-\/]+)/i);
    const supplierMatch = content.match(/اسم المورد[:\s]+([^\n]+)/i) || content.match(/Supplier[:\s]+([^\n]+)/i);
    const vatNumberMatch = content.match(/الرقم الضريبي[:\s]+([0-9\-]+)/i) || content.match(/VAT Number[:\s]+([0-9\-]+)/i);
    const totalMatch = content.match(/الإجمالي[:\s]+([0-9,.]+)/i) || content.match(/Total[:\s]+([0-9,.]+)/i);
    const vatAmountMatch = content.match(/ضريبة القيمة المضافة[:\s\(15%\)]+[:\s]+([0-9,.]+)/i) || content.match(/VAT[:\s\(15%\)]+[:\s]+([0-9,.]+)/i);
    const beforeTaxMatch = content.match(/المبلغ قبل الضريبة[:\s]+([0-9,.]+)/i) || content.match(/Amount before tax[:\s]+([0-9,.]+)/i);

    // Extract table data - look for account numbers and amounts
    const tableMatches = Array.from(content.matchAll(/\|?\s*([0-9]{4})\s*\|?\s*([^|]+?)\s*\|?\s*([0-9,.\s]+)?\s*\|?\s*([0-9,.\s]+)?/g));

    tableMatches.forEach((match) => {
      const accountNumber = match[1]?.trim();
      const accountName = match[2]?.trim();
      const debit = match[3]?.trim().replace(/[,\s]/g, '') || '';
      const credit = match[4]?.trim().replace(/[,\s]/g, '') || '';

      if (accountNumber && accountName && (debit || credit)) {
        entries.push({
          invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1].trim() : '',
          date: dateMatch ? dateMatch[1].trim() : '',
          supplier: supplierMatch ? supplierMatch[1].trim() : '',
          vatNumber: vatNumberMatch ? vatNumberMatch[1].trim() : '',
          accountNumber,
          accountName,
          debit: debit ? parseFloat(debit) : 0,
          credit: credit ? parseFloat(credit) : 0,
          total: totalMatch ? totalMatch[1].replace(/,/g, '') : '',
          vatAmount: vatAmountMatch ? vatAmountMatch[1].replace(/,/g, '') : '',
          beforeTax: beforeTaxMatch ? beforeTaxMatch[1].replace(/,/g, '') : '',
        });
      }
    });

    return entries;
  };

  // Download all journal entries as Excel
  const downloadJournalEntries = () => {
    if (processedInvoicesCount === 0) {
      alert('No invoices processed yet. Please upload and analyze invoices first.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Get all assistant messages that contain journal entries
      const journalMessages = messages.filter(
        (msg) => msg.role === 'assistant' && msg.content.includes('القيد المحاسبي')
      );

      if (journalMessages.length === 0) {
        alert('No journal entries found in the conversation.');
        return;
      }

      // Parse all entries
      const allEntries: any[] = [];
      journalMessages.forEach((msg, index) => {
        const entries = parseJournalEntry(msg.content);
        entries.forEach(entry => {
          allEntries.push({
            ...entry,
            invoiceIndex: index + 1,
          });
        });
      });

      if (allEntries.length === 0) {
        alert('Could not parse journal entries. Please ensure the AI has generated proper accounting entries.');
        return;
      }

      // Create main journal entries sheet with proper columns
      const journalData: any[][] = [
        ['القيود المحاسبية - Journal Entries'],
        ['التاريخ | Date: ' + new Date().toLocaleString()],
        ['عدد الفواتير | Total Invoices: ' + processedInvoicesCount],
        [],
        [
          'رقم الفاتورة\nInvoice #',
          'التاريخ\nDate',
          'اسم المورد\nSupplier',
          'الرقم الضريبي\nVAT Number',
          'رقم الحساب\nAccount #',
          'اسم الحساب\nAccount Name',
          'مدين\nDebit',
          'دائن\nCredit',
          'المبلغ قبل الضريبة\nBefore Tax',
          'ضريبة 15%\nVAT 15%',
          'الإجمالي\nTotal',
        ],
      ];

      allEntries.forEach((entry) => {
        journalData.push([
          entry.invoiceNumber,
          entry.date,
          entry.supplier,
          entry.vatNumber,
          entry.accountNumber,
          entry.accountName,
          entry.debit || '',
          entry.credit || '',
          entry.beforeTax,
          entry.vatAmount,
          entry.total,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(journalData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Invoice #
        { wch: 12 }, // Date
        { wch: 25 }, // Supplier
        { wch: 18 }, // VAT Number
        { wch: 12 }, // Account #
        { wch: 35 }, // Account Name
        { wch: 15 }, // Debit
        { wch: 15 }, // Credit
        { wch: 15 }, // Before Tax
        { wch: 15 }, // VAT
        { wch: 15 }, // Total
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Journal Entries');

      // Create summary sheet by invoice
      const summaryData: any[][] = [
        ['ملخص القيود حسب الفاتورة - Summary by Invoice'],
        [],
        ['رقم\n#', 'رقم الفاتورة\nInvoice', 'المورد\nSupplier', 'التاريخ\nDate', 'المبلغ قبل الضريبة\nBefore VAT', 'الضريبة 15%\nVAT', 'الإجمالي\nTotal'],
      ];

      const invoiceSummaries = new Map<string, any>();
      allEntries.forEach((entry) => {
        if (!invoiceSummaries.has(entry.invoiceNumber)) {
          invoiceSummaries.set(entry.invoiceNumber, {
            invoiceNumber: entry.invoiceNumber,
            supplier: entry.supplier,
            date: entry.date,
            beforeTax: entry.beforeTax,
            vatAmount: entry.vatAmount,
            total: entry.total,
            index: entry.invoiceIndex,
          });
        }
      });

      Array.from(invoiceSummaries.values()).forEach((inv) => {
        summaryData.push([
          inv.index,
          inv.invoiceNumber,
          inv.supplier,
          inv.date,
          inv.beforeTax,
          inv.vatAmount,
          inv.total,
        ]);
      });

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [
        { wch: 8 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Download the file
      const filename = `journal_entries_${processedInvoicesCount}_invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error creating Excel file:', error);
      alert('Error creating Excel file. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input || 'تحليل الفواتير المرفقة | Analyze the attached invoices',
      timestamp: new Date(),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const imagesToSend = [...uploadedImages];
    setUploadedImages([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/private-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input || 'تحليل الفواتير المرفقة | Analyze the attached invoices',
          sessionId: sessionId.current,
          images: imagesToSend,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Extract journal entries from response if present
      if (imagesToSend.length > 0 && data.content) {
        // Parse journal entries from the AI response
        parseAndStoreJournalEntries(data.content, imagesToSend.length);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      },
    ]);
    setUploadedImages([]);
    setProcessedInvoicesCount(0);
    setJournalEntries([]);
    sessionId.current = `private-${Date.now()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-emerald-500/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">مساعد المحاسبة الذكي | AI Accounting Assistant</h1>
                <p className="text-sm text-emerald-300">
                  Saudi Accounting Expert • ZATCA Compliant
                  {processedInvoicesCount > 0 && (
                    <span className="ml-3 px-3 py-1 bg-emerald-600/30 rounded-lg text-xs">
                      📋 {processedInvoicesCount} فاتورة | {processedInvoicesCount} Invoice{processedInvoicesCount > 1 ? 's' : ''} Processed
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {processedInvoicesCount > 0 && (
                <button
                  onClick={downloadJournalEntries}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors border border-green-500/30"
                >
                  <Download className="w-4 h-4" />
                  تحميل القيود | Download Entries
                </button>
              )}
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
                مسح | Clear
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-emerald-500/20 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white'
                      : 'bg-slate-700/80 text-slate-100 border border-emerald-500/20'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          code: ({ children }) => (
                            <code className="bg-slate-800 px-2 py-1 rounded text-emerald-300">{children}</code>
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
                    <>
                      {message.images && message.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Invoice ${idx + 1}`}
                              className="rounded-lg border border-white/20 max-h-40 object-contain"
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-base leading-relaxed">{message.content}</p>
                    </>
                  )}
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700/80 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 border border-emerald-500/20">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="text-base text-slate-300">جاري التحليل... | Analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-slate-900/80 backdrop-blur-sm border-t border-purple-500/20">
            {/* Image Preview Area */}
            {uploadedImages.length > 0 && (
              <div className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-emerald-300 font-medium">
                    📋 {uploadedImages.length} فاتورة جاهزة | {uploadedImages.length} Invoice{uploadedImages.length > 1 ? 's' : ''} Ready
                  </p>
                  <button
                    onClick={() => setUploadedImages([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Invoice ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-emerald-500/30"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-700/80 hover:bg-slate-600/80 text-emerald-300 rounded-xl px-4 py-3 flex items-center gap-2 border border-emerald-500/20 transition-all"
                disabled={isLoading}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك أو ارفع صور الفواتير... | Type or upload invoices..."
                className="flex-1 bg-slate-700/80 text-white placeholder-slate-400 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-emerald-500/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
                إرسال | Send
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-emerald-300/60">
            مساعد المحاسبة الذكي | AI Accounting Assistant • ZATCA • SOCPA • IFRS
          </p>
        </div>
      </div>
    </div>
  );
}
