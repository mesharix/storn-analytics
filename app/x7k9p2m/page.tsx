'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Trash2, Image as ImageIcon, X, Download, Settings, Plus, Edit, Save, TreeDeciduous } from 'lucide-react';
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

interface Account {
  code: string;
  nameAr: string;
  nameEn: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'vat';
}

interface CompanySettings {
  vatNumber: string;
  companyName: string;
  language: 'arabic' | 'english';
  vatMet: boolean; // استيفاء الضريبة
  accountingBasis: 'accrual'; // Always accrual for VAT
}

// Default Saudi Chart of Accounts
const DEFAULT_ACCOUNTS: Account[] = [
  // Assets (1xxx)
  { code: '1110', nameAr: 'النقدية بالصندوق', nameEn: 'Cash on Hand', type: 'asset' },
  { code: '1120', nameAr: 'البنك', nameEn: 'Bank Account', type: 'asset' },
  { code: '1210', nameAr: 'المدينون/العملاء', nameEn: 'Accounts Receivable', type: 'asset' },
  { code: '1220', nameAr: 'المخزون', nameEn: 'Inventory', type: 'asset' },
  { code: '1310', nameAr: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset' },

  // Liabilities (2xxx)
  { code: '2110', nameAr: 'الدائنون/الموردون', nameEn: 'Accounts Payable', type: 'liability' },
  { code: '2120', nameAr: 'المصروفات المستحقة', nameEn: 'Accrued Expenses', type: 'liability' },
  { code: '2131', nameAr: 'ضريبة ق.م - مخرجات', nameEn: 'VAT Output', type: 'vat' },
  { code: '2132', nameAr: 'ضريبة ق.م - مدخلات', nameEn: 'VAT Input', type: 'vat' },

  // Equity (3xxx)
  { code: '3100', nameAr: 'رأس المال', nameEn: 'Capital', type: 'equity' },
  { code: '3200', nameAr: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity' },

  // Revenue (4xxx)
  { code: '4100', nameAr: 'المبيعات', nameEn: 'Sales Revenue', type: 'revenue' },
  { code: '4200', nameAr: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue' },

  // Cost of Sales (5xxx)
  { code: '5100', nameAr: 'تكلفة المبيعات', nameEn: 'Cost of Sales', type: 'expense' },

  // Expenses (6xxx)
  { code: '6100', nameAr: 'المشتريات', nameEn: 'Purchases', type: 'expense' },
  { code: '6200', nameAr: 'رواتب وأجور', nameEn: 'Salaries & Wages', type: 'expense' },
  { code: '6300', nameAr: 'إيجارات', nameEn: 'Rent Expense', type: 'expense' },
  { code: '6400', nameAr: 'مصروفات كهرباء وماء', nameEn: 'Utilities', type: 'expense' },
  { code: '6500', nameAr: 'مصروفات صيانة', nameEn: 'Maintenance', type: 'expense' },
  { code: '6600', nameAr: 'مصروفات اتصالات', nameEn: 'Telephone & Internet', type: 'expense' },
  { code: '6700', nameAr: 'مصروفات مكتبية', nameEn: 'Office Supplies', type: 'expense' },
  { code: '6800', nameAr: 'مصروفات عمومية', nameEn: 'General Expenses', type: 'expense' },
];

export default function PrivateAgentPage() {
  // Settings and Setup State
  const [showSetupWizard, setShowSetupWizard] = useState(true);
  const [showAccountsManager, setShowAccountsManager] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    vatNumber: '',
    companyName: '',
    language: 'arabic',
    vatMet: false,
    accountingBasis: 'accrual',
  });
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState<Account>({
    code: '',
    nameAr: '',
    nameEn: '',
    type: 'expense',
  });

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [processedInvoicesCount, setProcessedInvoicesCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`private-${Date.now()}`);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('companySettings');
    const savedAccounts = localStorage.getItem('chartOfAccounts');

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setCompanySettings(settings);
      setShowSetupWizard(false);

      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: `مرحباً! أنا مساعدك المحاسبي الذكي لـ ${settings.companyName}.\n\nHello! I'm your AI Accounting Assistant for ${settings.companyName}.\n\n📋 الإعدادات | Settings:\n• الرقم الضريبي | VAT: ${settings.vatNumber}\n• استيفاء الضريبة | VAT Met: ${settings.vatMet ? '✓ نعم | Yes' : '✗ لا | No'}\n• أساس المحاسبة | Basis: الاستحقاق | Accrual\n• اللغة | Language: ${settings.language === 'arabic' ? 'العربية' : 'English'}\n\nارفع صور الفواتير للتحليل | Upload invoice images to analyze!`,
          timestamp: new Date(),
        },
      ]);
    }

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);

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

  // Save company settings
  const saveCompanySettings = () => {
    if (!companySettings.vatNumber || !companySettings.companyName) {
      alert('يرجى إدخال الرقم الضريبي واسم الشركة | Please enter VAT number and company name');
      return;
    }

    if (companySettings.vatNumber.replace(/[^0-9]/g, '').length !== 15) {
      alert('الرقم الضريبي يجب أن يكون 15 رقم | VAT number must be 15 digits');
      return;
    }

    localStorage.setItem('companySettings', JSON.stringify(companySettings));
    localStorage.setItem('chartOfAccounts', JSON.stringify(accounts));

    setShowSetupWizard(false);
    setMessages([
      {
        role: 'assistant',
        content: `مرحباً! أنا مساعدك المحاسبي الذكي لـ ${companySettings.companyName}.\n\nHello! I'm your AI Accounting Assistant for ${companySettings.companyName}.\n\n📋 الإعدادات | Settings:\n• الرقم الضريبي | VAT: ${companySettings.vatNumber}\n• استيفاء الضريبة | VAT Met: ${companySettings.vatMet ? '✓ نعم | Yes' : '✗ لا | No'}\n• أساس المحاسبة | Basis: الاستحقاق | Accrual\n• اللغة | Language: ${companySettings.language === 'arabic' ? 'العربية' : 'English'}\n\nارفع صور الفواتير للتحليل | Upload invoice images to analyze!`,
        timestamp: new Date(),
      },
    ]);
  };

  // Add new account
  const addAccount = () => {
    if (!newAccount.code || !newAccount.nameAr || !newAccount.nameEn) {
      alert('يرجى إدخال جميع البيانات | Please enter all fields');
      return;
    }

    if (accounts.find((a) => a.code === newAccount.code)) {
      alert('رقم الحساب موجود مسبقاً | Account code already exists');
      return;
    }

    const updatedAccounts = [...accounts, newAccount].sort((a, b) => a.code.localeCompare(b.code));
    setAccounts(updatedAccounts);
    localStorage.setItem('chartOfAccounts', JSON.stringify(updatedAccounts));

    setNewAccount({ code: '', nameAr: '', nameEn: '', type: 'expense' });
  };

  // Delete account
  const deleteAccount = (code: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟ | Are you sure you want to delete this account?')) {
      return;
    }

    const updatedAccounts = accounts.filter((a) => a.code !== code);
    setAccounts(updatedAccounts);
    localStorage.setItem('chartOfAccounts', JSON.stringify(updatedAccounts));
  };

  // Edit account
  const saveEditAccount = () => {
    if (!editingAccount) return;

    const updatedAccounts = accounts.map((a) =>
      a.code === editingAccount.code ? editingAccount : a
    );
    setAccounts(updatedAccounts);
    localStorage.setItem('chartOfAccounts', JSON.stringify(updatedAccounts));
    setEditingAccount(null);
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
      // Build context with company settings and chart of accounts
      const contextInfo = `
شركة: ${companySettings.companyName}
الرقم الضريبي: ${companySettings.vatNumber}
استيفاء الضريبة: ${companySettings.vatMet ? 'نعم' : 'لا'}
أساس المحاسبة: الاستحقاق (Accrual Basis)
اللغة المفضلة: ${companySettings.language === 'arabic' ? 'العربية' : 'English'}

Company: ${companySettings.companyName}
VAT Number: ${companySettings.vatNumber}
VAT Met: ${companySettings.vatMet ? 'Yes' : 'No'}
Accounting Basis: Accrual (record transactions when they occur, not when cash is paid)
Preferred Language: ${companySettings.language === 'arabic' ? 'Arabic' : 'English'}

دليل الحسابات المتاح | Available Chart of Accounts:
${accounts.map(acc => `${acc.code} - ${companySettings.language === 'arabic' ? acc.nameAr : acc.nameEn} (${acc.type})`).join('\n')}

⚠️ IMPORTANT: Use ACCRUAL basis - record VAT when invoice is issued/received, NOT when payment is made.
استخدم أساس الاستحقاق - سجل الضريبة عند إصدار/استلام الفاتورة، وليس عند الدفع.
`.trim();

      const response = await fetch('/api/private-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input || 'تحليل الفواتير المرفقة | Analyze the attached invoices',
          context: contextInfo,
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
      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-emerald-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-4 mb-4">
                <Settings className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">إعداد النظام المحاسبي | System Setup</h2>
              <p className="text-slate-300">قم بإدخال بيانات شركتك لبدء استخدام النظام | Enter your company details to get started</p>
            </div>

            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  اسم الشركة | Company Name *
                </label>
                <input
                  type="text"
                  value={companySettings.companyName}
                  onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                  placeholder="مثال: شركة النور للتجارة | Example: Al-Noor Trading Company"
                  className="w-full bg-slate-700/80 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-emerald-500/20"
                />
              </div>

              {/* VAT Number */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  الرقم الضريبي (15 رقم) | VAT Number (15 digits) *
                </label>
                <input
                  type="text"
                  value={companySettings.vatNumber}
                  onChange={(e) => setCompanySettings({ ...companySettings, vatNumber: e.target.value })}
                  placeholder="300000000000003"
                  maxLength={15}
                  className="w-full bg-slate-700/80 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-emerald-500/20 font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {companySettings.vatNumber.replace(/[^0-9]/g, '').length}/15 digits
                </p>
              </div>

              {/* VAT Met Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg border border-emerald-500/20">
                <input
                  type="checkbox"
                  id="vatMet"
                  checked={companySettings.vatMet}
                  onChange={(e) => setCompanySettings({ ...companySettings, vatMet: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 bg-slate-700 border-emerald-500 rounded focus:ring-emerald-500"
                />
                <label htmlFor="vatMet" className="text-white text-sm cursor-pointer">
                  <span className="font-semibold">استيفاء الضريبة | VAT Met</span>
                  <p className="text-xs text-slate-400 mt-1">
                    يتم احتساب الضريبة على أساس الاستحقاق (وليس النقدي) | VAT calculated on accrual basis (not cash basis)
                  </p>
                </label>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-3">
                  لغة التقارير | Report Language *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCompanySettings({ ...companySettings, language: 'arabic' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      companySettings.language === 'arabic'
                        ? 'border-emerald-500 bg-emerald-600/20'
                        : 'border-slate-600 hover:border-emerald-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🇸🇦</span>
                      <div className="text-left">
                        <p className="text-white font-semibold">العربية</p>
                        <p className="text-sm text-slate-400">Arabic</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setCompanySettings({ ...companySettings, language: 'english' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      companySettings.language === 'english'
                        ? 'border-emerald-500 bg-emerald-600/20'
                        : 'border-slate-600 hover:border-emerald-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🇬🇧</span>
                      <div className="text-left">
                        <p className="text-white font-semibold">English</p>
                        <p className="text-sm text-slate-400">إنجليزي</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Accounting Basis Info */}
              <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>ℹ️ أساس المحاسبة | Accounting Basis:</strong> الاستحقاق | Accrual
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  يتم تسجيل المعاملات عند حدوثها (وليس عند السداد النقدي) | Transactions recorded when they occur (not when cash is paid)
                </p>
              </div>

              {/* Chart of Accounts Button */}
              <button
                onClick={() => setShowAccountsManager(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors border border-purple-500/30"
              >
                <TreeDeciduous className="w-5 h-5" />
                <span>إدارة دليل الحسابات | Manage Chart of Accounts ({accounts.length} accounts)</span>
              </button>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveCompanySettings}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg transition-all font-semibold"
                >
                  <Save className="w-5 h-5" />
                  حفظ والبدء | Save & Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Manager Modal */}
      {showAccountsManager && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-6xl w-full border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">دليل الحسابات | Chart of Accounts</h2>
                <p className="text-sm text-slate-400">إدارة حسابات شركتك | Manage your company accounts</p>
              </div>
              <button
                onClick={() => setShowAccountsManager(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add New Account Form */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-300 mb-3">إضافة حساب جديد | Add New Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="رقم الحساب | Code"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                  className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={4}
                />
                <input
                  type="text"
                  placeholder="الاسم بالعربي | Arabic Name"
                  value={newAccount.nameAr}
                  onChange={(e) => setNewAccount({ ...newAccount, nameAr: e.target.value })}
                  className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="English Name"
                  value={newAccount.nameEn}
                  onChange={(e) => setNewAccount({ ...newAccount, nameEn: e.target.value })}
                  className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as any })}
                  className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="asset">أصول | Asset</option>
                  <option value="liability">خصوم | Liability</option>
                  <option value="equity">حقوق ملكية | Equity</option>
                  <option value="revenue">إيرادات | Revenue</option>
                  <option value="expense">مصروفات | Expense</option>
                  <option value="vat">ضريبة | VAT</option>
                </select>
                <button
                  onClick={addAccount}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  إضافة | Add
                </button>
              </div>
            </div>

            {/* Accounts List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="text-left text-purple-300 font-semibold px-3 py-2">رقم | Code</th>
                    <th className="text-left text-purple-300 font-semibold px-3 py-2">الاسم بالعربي | Arabic</th>
                    <th className="text-left text-purple-300 font-semibold px-3 py-2">English Name</th>
                    <th className="text-left text-purple-300 font-semibold px-3 py-2">النوع | Type</th>
                    <th className="text-right text-purple-300 font-semibold px-3 py-2">إجراءات | Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.code} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      {editingAccount?.code === account.code ? (
                        <>
                          <td className="px-3 py-2 font-mono text-slate-300">{account.code}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editingAccount.nameAr}
                              onChange={(e) => setEditingAccount({ ...editingAccount, nameAr: e.target.value })}
                              className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={editingAccount.nameEn}
                              onChange={(e) => setEditingAccount({ ...editingAccount, nameEn: e.target.value })}
                              className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editingAccount.type}
                              onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as any })}
                              className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm"
                            >
                              <option value="asset">Asset</option>
                              <option value="liability">Liability</option>
                              <option value="equity">Equity</option>
                              <option value="revenue">Revenue</option>
                              <option value="expense">Expense</option>
                              <option value="vat">VAT</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={saveEditAccount}
                              className="text-green-400 hover:text-green-300 mr-2"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingAccount(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 font-mono text-slate-300">{account.code}</td>
                          <td className="px-3 py-2 text-white">{account.nameAr}</td>
                          <td className="px-3 py-2 text-slate-300">{account.nameEn}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              account.type === 'asset' ? 'bg-blue-600/20 text-blue-300' :
                              account.type === 'liability' ? 'bg-red-600/20 text-red-300' :
                              account.type === 'equity' ? 'bg-purple-600/20 text-purple-300' :
                              account.type === 'revenue' ? 'bg-green-600/20 text-green-300' :
                              account.type === 'vat' ? 'bg-yellow-600/20 text-yellow-300' :
                              'bg-orange-600/20 text-orange-300'
                            }`}>
                              {account.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => setEditingAccount({ ...account })}
                              className="text-blue-400 hover:text-blue-300 mr-2"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAccount(account.code)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">إجمالي الحسابات | Total Accounts: <span className="text-white font-semibold">{accounts.length}</span></p>
              <button
                onClick={() => setShowAccountsManager(false)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                إغلاق | Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                <h1 className="text-2xl font-bold text-white">
                  {companySettings.companyName || 'مساعد المحاسبة الذكي | AI Accounting Assistant'}
                </h1>
                <p className="text-sm text-emerald-300">
                  Saudi Accounting Expert • ZATCA Compliant • {companySettings.language === 'arabic' ? 'العربية' : 'English'}
                  {processedInvoicesCount > 0 && (
                    <span className="ml-3 px-3 py-1 bg-emerald-600/30 rounded-lg text-xs">
                      📋 {processedInvoicesCount} فاتورة | {processedInvoicesCount} Invoice{processedInvoicesCount > 1 ? 's' : ''} Processed
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAccountsManager(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors border border-purple-500/30"
              >
                <TreeDeciduous className="w-4 h-4" />
                دليل الحسابات | Accounts
              </button>
              <button
                onClick={() => setShowSetupWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors border border-blue-500/30"
              >
                <Settings className="w-4 h-4" />
                الإعدادات | Settings
              </button>
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
