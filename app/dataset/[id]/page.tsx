'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Table2, BarChart3, TrendingUp, Loader2,
  Download, Filter, PieChart, ScatterChart, Grid3X3, Activity, Target
} from 'lucide-react';
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
  PieChart as RePieChart,
  Pie,
  Cell,
  ScatterChart as ReScatterChart,
  Scatter,
  ZAxis,
  Treemap,
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  getUniqueValues,
  applyAdvancedFilters,
  exportToSQL,
  exportToJSON,
  prepareTreemapData,
  SUM,
  AVERAGE,
  COUNT,
  MIN,
  MAX,
  DISTINCTCOUNT,
  FilterCondition
} from '@/lib/powerbi-analytics';
import { EcommerceAnalysisButtons } from '@/components/EcommerceAnalysisButtons';
import { EcommerceInsights } from '@/components/EcommerceInsights';

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

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function DatasetPage() {
  const params = useParams();
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'stats' | 'insights' | 'charts' | 'kpis'>('data');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter' | 'treemap'>('bar');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [categoryColumn, setCategoryColumn] = useState<string>('');
  const [valueColumn, setValueColumn] = useState<string>('');
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'count' | 'min' | 'max'>('sum');
  const [chartDateFrom, setChartDateFrom] = useState<string>('');
  const [chartDateTo, setChartDateTo] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, FilterCondition>>({});
  const [filteredRecords, setFilteredRecords] = useState<Array<{ data: any }>>([]);

  useEffect(() => {
    fetchDataset();
  }, [params.id]);

  useEffect(() => {
    if (dataset) {
      applyFilters();
    }
  }, [filters, dataset]);

  const fetchDataset = async () => {
    try {
      const res = await fetch(`/api/datasets/${params.id}`);
      const data = await res.json();
      setDataset(data);
      setFilteredRecords(data.records);

      // Auto-select first two numeric columns for charts
      const summaryAnalysis = data.analyses.find((a: Analysis) => a.type === 'summary');
      if (summaryAnalysis) {
        const numericCols = summaryAnalysis.results.columnStats
          .filter((stat: ColumnStat) => stat.type === 'numeric')
          .map((stat: ColumnStat) => stat.column)
          .slice(0, 2);
        setSelectedColumns(numericCols);
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!dataset) return;

    const filterConditions: FilterCondition[] = Object.entries(filters)
      .filter(([_, condition]) => condition.value)
      .map(([column, condition]) => ({
        column,
        operator: condition.operator,
        value: condition.value,
        value2: condition.value2
      }));

    if (filterConditions.length === 0) {
      setFilteredRecords(dataset.records);
    } else {
      const dataArray = dataset.records.map(r => r.data);
      const filteredData = applyAdvancedFilters(dataArray, filterConditions);
      setFilteredRecords(filteredData.map(data => ({ data })));
    }
  };

  const runAnalysis = async (type: string) => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: params.id,
          analysisType: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Analysis failed: ${data.error || 'Unknown error'}`);
        console.error('Analysis error:', data);
        return;
      }

      await fetchDataset();

      // Automatically switch to insights tab after successful analysis
      setActiveTab('insights');
      alert(`${data.analysis.name} completed successfully!`);
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Failed to run analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Export Functions
  const exportToCSV = () => {
    if (!dataset) return;

    const records = filteredRecords.map(r => r.data);
    const headers = Object.keys(records[0] || {});

    let csv = headers.join(',') + '\n';
    records.forEach(record => {
      csv += headers.map(header => {
        const value = record[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsSQLInserts = () => {
    if (!dataset) return;
    const records = filteredRecords.map(r => r.data);
    const sql = exportToSQL(records, dataset.name.replace(/\s+/g, '_').toLowerCase());

    const blob = new Blob([sql], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    if (!dataset) return;
    const records = filteredRecords.map(r => r.data);
    const json = exportToJSON(records, true);

    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (!dataset) return;

    const records = filteredRecords.map(r => r.data);
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Add statistics sheet if available
    const summaryAnalysis = dataset.analyses.find(a => a.type === 'summary');
    if (summaryAnalysis?.results?.columnStats) {
      const statsWs = XLSX.utils.json_to_sheet(summaryAnalysis.results.columnStats);
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
    }

    XLSX.writeFile(wb, `${dataset.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Chart Data Preparation
  const prepareChartData = () => {
    if (!dataset || !categoryColumn || !valueColumn) return [];

    // Apply date filtering if date range is selected
    let recordsToUse = filteredRecords;

    if (chartDateFrom || chartDateTo) {
      const dateColumn = columns.find(col => col === 'تاريخ الطلب');
      if (dateColumn) {
        recordsToUse = filteredRecords.filter(record => {
          const recordDate = record.data[dateColumn];
          if (!recordDate) return false;

          const date = new Date(recordDate);
          const fromDate = chartDateFrom ? new Date(chartDateFrom) : null;
          const toDate = chartDateTo ? new Date(chartDateTo) : null;

          if (fromDate && toDate) {
            return date >= fromDate && date <= toDate;
          } else if (fromDate) {
            return date >= fromDate;
          } else if (toDate) {
            return date <= toDate;
          }
          return true;
        });
      }
    }

    // Group by category and aggregate values
    const grouped: Record<string, number[]> = {};

    recordsToUse.forEach(record => {
      const category = String(record.data[categoryColumn] || 'Unknown');
      const value = Number(record.data[valueColumn]) || 0;

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(value);
    });

    // Apply aggregation function
    const chartData = Object.entries(grouped).map(([category, values]) => {
      let aggregatedValue = 0;

      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'average':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
      }

      return {
        name: category,
        value: aggregatedValue,
        count: values.length
      };
    });

    // Sort by value descending and take top 20
    return chartData.sort((a, b) => b.value - a.value).slice(0, 20);
  };

  const preparePieData = () => {
    return prepareChartData().slice(0, 10); // Limit pie chart to top 10
  };

  const renderChart = () => {
    const data = prepareChartData();

    if (data.length === 0) {
      return <p className="text-center text-gray-400 py-12">No data to display</p>;
    }

    const aggregationLabel = aggregation.charAt(0).toUpperCase() + aggregation.slice(1);

    if (chartType === 'pie') {
      const pieData = preparePieData();
      return (
        <ResponsiveContainer width="100%" height={500}>
          <RePieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({name, value, percent}) => `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
              formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
            />
            <Legend />
          </RePieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
              formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
              name={`${aggregationLabel} of ${valueColumn}`}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default: Bar Chart
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
            formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
          />
          <Legend />
          <Bar
            dataKey="value"
            fill="url(#barGradient)"
            name={`${aggregationLabel} of ${valueColumn}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    );
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
  const columns = dataset.records.length > 0 ? Object.keys(dataset.records[0].data as Record<string, any>) : [];

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

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </button>
              <button
                onClick={exportAsSQLInserts}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 mr-1" />
                SQL
              </button>
              <button
                onClick={exportAsJSON}
                className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-6 mt-6">
            <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-xl">
              <span className="text-blue-300 font-semibold">{filteredRecords.length.toLocaleString()}</span>
              <span className="text-blue-400 text-sm ml-1">rows</span>
              {filteredRecords.length !== dataset.rowCount && (
                <span className="text-xs text-gray-400 ml-2">(filtered from {dataset.rowCount.toLocaleString()})</span>
              )}
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
        {/* E-Commerce Analysis Actions */}
        <EcommerceAnalysisButtons onRunAnalysis={runAnalysis} analyzing={analyzing} />

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
                onClick={() => setActiveTab('charts')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'charts'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <PieChart className="w-5 h-5 inline mr-2" />
                Charts
                {activeTab === 'charts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'insights'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Insights
                {activeTab === 'insights' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('kpis')}
                className={`px-8 py-5 font-bold text-sm transition-all relative ${
                  activeTab === 'kpis'
                    ? 'text-indigo-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                }`}
              >
                <Activity className="w-5 h-5 inline mr-2" />
                KPIs
                {activeTab === 'kpis' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'data' && (
              <div>
                {/* Advanced Filters with Operators */}
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                  <div className="flex items-center mb-3">
                    <Filter className="w-5 h-5 text-indigo-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      // Define the desired order of columns
                      let columnOrder = ['الدولة', 'المدينة', 'طريقة الدفع', 'مجموع السلة', 'تاريخ الطلب', 'اسم المنتج'];

                      // Remove 'مجموع السلة' if 'اجمالي الطلب' exists
                      if (columns.includes('اجمالي الطلب')) {
                        columnOrder = columnOrder.filter(col => col !== 'مجموع السلة');
                        // Add 'اجمالي الطلب' in the same position
                        columnOrder.splice(3, 0, 'اجمالي الطلب');
                      }

                      // Filter columns to only include those that exist in the data and match our order
                      const orderedColumns = columnOrder.filter(col => columns.includes(col));

                      return orderedColumns.map(column => {
                        const uniqueValues = getUniqueValues(dataset.records.map(r => r.data), column);
                        const currentFilter = filters[column] || { operator: 'equals', value: '' };

                        // Check if this column should skip the operator dropdown
                        const skipOperatorDropdown = ['الدولة', 'اسم المنتج', 'طريقة الدفع', 'المدينة'].includes(column);

                        // Columns that should only show dropdown (no search input)
                        const dropdownOnly = ['الدولة', 'المدينة', 'طريقة الدفع', 'اسم المنتج'].includes(column);

                        // Special handling for date column
                        const isDateColumn = column === 'تاريخ الطلب';

                        // Map column display names
                        const displayName = column;

                      return (
                        <div key={column} className="bg-slate-900/50 p-3 rounded-lg">
                          <label className="block text-sm font-medium text-gray-300 mb-2">{displayName}</label>
                          <div className="space-y-2">
                            {!skipOperatorDropdown && (
                              <select
                                value={currentFilter.operator}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, operator: e.target.value as any }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="equals">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="greaterThan">Greater Than</option>
                                <option value="lessThan">Less Than</option>
                                <option value="between">Between</option>
                              </select>
                            )}

                            {isDateColumn ? (
                              <div className="flex space-x-2">
                                <input
                                  type="date"
                                  placeholder="From"
                                  value={currentFilter.value || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, operator: 'between', value: e.target.value }
                                  })}
                                  className="w-1/2 px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                  type="date"
                                  placeholder="To"
                                  value={currentFilter.value2 || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, operator: 'between', value2: e.target.value }
                                  })}
                                  className="w-1/2 px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            ) : !skipOperatorDropdown && currentFilter.operator === 'between' ? (
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  placeholder="Min"
                                  value={currentFilter.value || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value: e.target.value }
                                  })}
                                  className="w-1/2 px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Max"
                                  value={currentFilter.value2 || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value2: e.target.value }
                                  })}
                                  className="w-1/2 px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            ) : dropdownOnly ? (
                              <select
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">All Values</option>
                                {uniqueValues.slice(0, 50).map((val: any) => (
                                  <option key={val} value={val}>{String(val)}</option>
                                ))}
                              </select>
                            ) : skipOperatorDropdown || column === 'مجموع السلة' || column === 'اجمالي الطلب' ? (
                              <input
                                type="text"
                                placeholder={`Filter ${displayName}...`}
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : uniqueValues.length <= 50 ? (
                              <select
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">All Values</option>
                                {uniqueValues.slice(0, 50).map((val: any) => (
                                  <option key={val} value={val}>{String(val)}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder={`Filter ${column}...`}
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-700/50 border border-indigo-500/20 rounded text-white text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                            )}
                          </div>
                        </div>
                      );
                    });
                    })()}
                  </div>
                  {Object.values(filters).some(v => v?.value) && (
                    <button
                      onClick={() => setFilters({})}
                      className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {filteredRecords.length > 0 && (
                    <table className="min-w-full divide-y divide-indigo-500/20">
                      <thead className="bg-slate-800/50">
                        <tr>
                          {Object.keys(filteredRecords[0].data as Record<string, any>).map((key) => (
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
                        {filteredRecords.slice(0, 100).map((record, idx) => (
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
                  {filteredRecords.length > 100 && (
                    <p className="text-sm text-gray-400 mt-4">
                      Showing first 100 rows of {filteredRecords.length.toLocaleString()}
                    </p>
                  )}
                  {filteredRecords.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No records match the current filters</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div>
                <div className="mb-6 p-6 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Column (Text Data) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category (Text)</label>
                      <select
                        value={categoryColumn}
                        onChange={(e) => setCategoryColumn(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select category...</option>
                        {columnStats.filter(stat => stat.type === 'text').map(stat => (
                          <option key={stat.column} value={stat.column}>{stat.column}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">X-axis</p>
                    </div>

                    {/* Value Column (Numeric Data) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Value (Numeric)</label>
                      <select
                        value={valueColumn}
                        onChange={(e) => setValueColumn(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select value...</option>
                        {columnStats.filter(stat => stat.type === 'numeric').map(stat => (
                          <option key={stat.column} value={stat.column}>{stat.column}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Y-axis</p>
                    </div>

                    {/* Aggregation Function */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Aggregation</label>
                      <select
                        value={aggregation}
                        onChange={(e) => setAggregation(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="sum">Sum</option>
                        <option value="average">Average</option>
                        <option value="count">Count</option>
                        <option value="min">Minimum</option>
                        <option value="max">Maximum</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Function to apply</p>
                    </div>

                    {/* Chart Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setChartType('bar')}
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                          title="Bar Chart"
                        >
                          <BarChart3 className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => setChartType('line')}
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                          title="Line Chart"
                        >
                          <TrendingUp className="w-5 h-5 mx-auto" />
                        </button>
                        <button
                          onClick={() => setChartType('pie')}
                          className={`flex-1 px-3 py-2 rounded-lg transition-colors ${chartType === 'pie' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                          title="Pie Chart"
                        >
                          <PieChart className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Visualization style</p>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">From Date (Optional)</label>
                      <input
                        type="date"
                        value={chartDateFrom}
                        onChange={(e) => setChartDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Filter data from this date</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">To Date (Optional)</label>
                      <input
                        type="date"
                        value={chartDateTo}
                        onChange={(e) => setChartDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Filter data until this date</p>
                    </div>
                  </div>

                  {/* Clear Date Range Button */}
                  {(chartDateFrom || chartDateTo) && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setChartDateFrom('');
                          setChartDateTo('');
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Clear date range
                      </button>
                    </div>
                  )}

                  {/* Chart Description */}
                  {categoryColumn && valueColumn && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                      <p className="text-sm text-indigo-300">
                        <span className="font-semibold">Chart:</span> {aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} of <span className="font-semibold">{valueColumn}</span> grouped by <span className="font-semibold">{categoryColumn}</span>
                        {(chartDateFrom || chartDateTo) && (
                          <span className="ml-2">
                            ({chartDateFrom && `from ${chartDateFrom}`}{chartDateFrom && chartDateTo && ' '}{chartDateTo && `to ${chartDateTo}`})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/50 rounded-lg p-6">
                  {categoryColumn && valueColumn ? renderChart() : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg font-semibold mb-2">Select data to visualize</p>
                      <p className="text-gray-500 text-sm">Choose a category column and a value column to create your chart</p>
                    </div>
                  )}
                </div>
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

            {activeTab === 'insights' && (
              <div className="space-y-6">
                {dataset.analyses.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2 text-lg font-semibold">No insights yet</p>
                    <p className="text-gray-500 text-sm">Run one of the e-commerce analysis tools above to generate insights about your data</p>
                  </div>
                ) : (
                  dataset.analyses
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((analysis) => (
                      <div key={analysis.id} className="border border-indigo-500/20 bg-slate-800/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-white">{analysis.name}</h3>
                          <span className="text-xs text-gray-400 bg-slate-700/50 px-3 py-1 rounded-full">
                            {new Date(analysis.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Use E-Commerce Insights Component */}
                        <EcommerceInsights analysis={analysis} />
                      </div>
                    ))
                )}
              </div>
            )}

            {activeTab === 'kpis' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Total Records KPI */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-blue-300">Total Records</h3>
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{COUNT(filteredRecords.map(r => r.data)).toLocaleString()}</p>
                    <p className="text-xs text-blue-300 mt-1">Rows in dataset</p>
                  </div>

                  {/* Numeric Column KPIs */}
                  {columnStats.filter(stat => stat.type === 'numeric').slice(0, 7).map((stat, idx) => {
                    const records = filteredRecords.map(r => r.data);
                    const sum = SUM(records, stat.column);
                    const avg = AVERAGE(records, stat.column);
                    const min = MIN(records, stat.column);
                    const max = MAX(records, stat.column);
                    const distinct = DISTINCTCOUNT(records, stat.column);

                    const colors = [
                      { from: 'purple-500', to: 'purple-600', text: 'purple' },
                      { from: 'green-500', to: 'green-600', text: 'green' },
                      { from: 'orange-500', to: 'orange-600', text: 'orange' },
                      { from: 'pink-500', to: 'pink-600', text: 'pink' },
                      { from: 'cyan-500', to: 'cyan-600', text: 'cyan' },
                      { from: 'yellow-500', to: 'yellow-600', text: 'yellow' },
                      { from: 'indigo-500', to: 'indigo-600', text: 'indigo' }
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={stat.column} className={`bg-gradient-to-br from-${color.from}/20 to-${color.to}/20 border border-${color.from}/30 rounded-xl p-6 shadow-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-sm font-medium text-${color.text}-300`}>{stat.column}</h3>
                          <Activity className={`w-5 h-5 text-${color.text}-400`} />
                        </div>
                        <div className="space-y-1">
                          <div>
                            <p className="text-xs text-gray-400">Sum</p>
                            <p className="text-xl font-bold text-white">{sum.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                              <p className="text-gray-400">Avg</p>
                              <p className="text-white font-semibold">{avg.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Distinct</p>
                              <p className="text-white font-semibold">{distinct}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Min</p>
                              <p className="text-white font-semibold">{min.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Max</p>
                              <p className="text-white font-semibold">{max.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {columnStats.filter(stat => stat.type === 'numeric').length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No numeric columns found for KPI calculation</p>
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
