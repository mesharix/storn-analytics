'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
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
  const [secondCategoryColumn, setSecondCategoryColumn] = useState<string>('');
  const [chartMode, setChartMode] = useState<'numeric' | 'categorical'>('numeric');
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'count' | 'min' | 'max'>('count');
  const [chartDateFrom, setChartDateFrom] = useState<string>('');
  const [chartDateTo, setChartDateTo] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, FilterCondition>>({});
  const [filteredRecords, setFilteredRecords] = useState<Array<{ data: any }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAllFilters, setShowAllFilters] = useState(false);

  useEffect(() => {
    fetchDataset();
  }, [params.id]);

  // Debounced filter application
  useEffect(() => {
    if (dataset) {
      const timeoutId = setTimeout(() => {
        applyFilters();
      }, 300); // 300ms debounce
      return () => clearTimeout(timeoutId);
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

    setCurrentPage(1); // Reset to first page when filters change

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

  // Memoized derived values
  const summaryAnalysis = useMemo(() => dataset?.analyses.find(a => a.type === 'summary'), [dataset?.analyses]);
  const columnStats: ColumnStat[] = useMemo(() => summaryAnalysis?.results?.columnStats || [], [summaryAnalysis]);
  const correlationAnalysis = useMemo(() => dataset?.analyses.find(a => a.type === 'correlation'), [dataset?.analyses]);
  const columns = useMemo(() => dataset?.records && dataset.records.length > 0 ? Object.keys(dataset.records[0].data as Record<string, any>) : [], [dataset?.records]);

  // Export Functions - Memoized callbacks
  const exportToCSV = useCallback(() => {
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
  }, [dataset, filteredRecords]);

  const exportAsSQLInserts = useCallback(() => {
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
  }, [dataset, filteredRecords]);

  const exportAsJSON = useCallback(() => {
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
  }, [dataset, filteredRecords]);

  const exportToExcel = useCallback(() => {
    if (!dataset) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Filtered Data
    const records = filteredRecords.map(r => r.data);
    const ws = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Sheet 2: Column Statistics
    if (columnStats.length > 0) {
      const statsData = columnStats.map(stat => ({
        'Column': stat.column,
        'Type': stat.type,
        'Total Count': stat.count,
        'Null Count': stat.nullCount,
        'Unique Values': stat.unique,
        'Min': stat.min || 'N/A',
        'Max': stat.max || 'N/A',
        'Mean': stat.mean || 'N/A',
        'Median': stat.median || 'N/A',
      }));
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
    }

    // Sheet 3: Chart Data (if chart is configured)
    if (categoryColumn && valueColumn && chartData.length > 0) {
      const chartWs = XLSX.utils.json_to_sheet(chartData);
      XLSX.utils.book_append_sheet(wb, chartWs, 'Chart Data');
    }

    // Sheet 4: Summary Info
    const summaryData = [{
      'Dataset Name': dataset.name,
      'Export Date': new Date().toLocaleString(),
      'Total Rows': dataset.rowCount,
      'Filtered Rows': filteredRecords.length,
      'Columns': columns.length,
      'Filters Applied': Object.keys(filters).filter(k => filters[k].value).length,
    }];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Export Info');

    // Sheet 5: Chart Instructions
    const instructionsData = [
      { 'Step': 1, 'Instruction': 'Go to the "Chart Data" sheet' },
      { 'Step': 2, 'Instruction': 'Select all the data in the sheet' },
      { 'Step': 3, 'Instruction': 'Click "Insert" tab in Excel' },
      { 'Step': 4, 'Instruction': 'Choose your preferred chart type (Bar, Line, Pie, etc.)' },
      { 'Step': 5, 'Instruction': 'Excel will automatically create a chart from your data' },
      { 'Step': '', 'Instruction': '' },
      { 'Step': 'Note', 'Instruction': 'The Chart Data sheet contains aggregated data ready for visualization' },
      { 'Step': 'Tip', 'Instruction': 'For filtered results, use the Data sheet and create pivot tables' },
    ];
    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'How to Create Charts');

    XLSX.writeFile(wb, `${dataset.name}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [dataset, filteredRecords, columnStats]);

  // Chart Data Preparation - Memoized for performance
  const chartData = useMemo(() => {
    if (!dataset || !categoryColumn) return [];

    // For categorical mode (text vs text), we don't need valueColumn
    if (chartMode === 'categorical' && !secondCategoryColumn) return [];

    // For numeric mode, we need valueColumn
    if (chartMode === 'numeric' && !valueColumn) return [];

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

    // Text vs Text (Categorical) mode
    if (chartMode === 'categorical') {
      const grouped: Record<string, Record<string, number>> = {};

      recordsToUse.forEach(record => {
        const category = String(record.data[categoryColumn] || 'Unknown');
        const secondCategory = String(record.data[secondCategoryColumn] || 'Unknown');

        if (!grouped[category]) {
          grouped[category] = {};
        }
        if (!grouped[category][secondCategory]) {
          grouped[category][secondCategory] = 0;
        }
        grouped[category][secondCategory]++;
      });

      // Convert to chart format
      const chartData = Object.entries(grouped).map(([category, subcategories]) => {
        const total = Object.values(subcategories).reduce((sum, val) => sum + val, 0);
        return {
          name: category,
          value: total,
          count: total,
          breakdown: subcategories
        };
      });

      return chartData.sort((a, b) => b.value - a.value).slice(0, 20);
    }

    // Text vs Numeric mode (original behavior)
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

    // Sort by value descending and take top 15 for better performance
    return chartData.sort((a, b) => b.value - a.value).slice(0, 15);
  }, [dataset, categoryColumn, valueColumn, secondCategoryColumn, chartMode, aggregation, filteredRecords, chartDateFrom, chartDateTo, columns]);

  const pieData = useMemo(() => chartData.slice(0, 8), [chartData]);

  // Memoize table headers for performance
  const tableHeaders = useMemo(() => {
    if (filteredRecords.length === 0) return [];
    return Object.keys(filteredRecords[0].data as Record<string, any>);
  }, [filteredRecords]);

  // Memoize paginated data
  const paginatedData = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  // Memoize filter columns (show only 6 by default, expand to show all)
  const filterColumns = useMemo(() => {
    return showAllFilters ? columns : columns.slice(0, 6);
  }, [columns, showAllFilters]);

  // Memoize unique values calculation (expensive operation)
  const uniqueValuesCache = useMemo(() => {
    const cache: Record<string, any[]> = {};
    filterColumns.forEach(column => {
      cache[column] = getUniqueValues(dataset?.records.map(r => r.data) || [], column);
    });
    return cache;
  }, [filterColumns, dataset?.records]);

  const renderChart = () => {
    const data = chartData;

    if (data.length === 0) {
      return <p className="text-center text-gray-400 py-12">No data to display</p>;
    }

    const aggregationLabel = aggregation.charAt(0).toUpperCase() + aggregation.slice(1);

    if (chartType === 'pie') {
      const pieDataForRender = pieData;
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RePieChart>
            <Pie
              data={pieDataForRender}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              animationDuration={300}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
              formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
            />
          </RePieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
              formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name={`${aggregationLabel} of ${valueColumn}`}
              animationDuration={300}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default: Bar Chart
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} interval={0} />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #4f46e5', borderRadius: '8px'}}
            formatter={(value: any) => [value.toLocaleString(), `${aggregationLabel} of ${valueColumn}`]}
          />
          <Bar
            dataKey="value"
            name={`${aggregationLabel} of ${valueColumn}`}
            animationDuration={300}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
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
                {/* Advanced Filters with Smart Detection */}
                <div className="mb-6 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-indigo-500/30 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Filter className="w-5 h-5 text-indigo-400 mr-2" />
                      <h3 className="text-xl font-bold text-white">Filters</h3>
                      <span className="ml-3 px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                        {Object.values(filters).filter(v => v?.value).length} active
                      </span>
                    </div>
                    {Object.values(filters).some(v => v?.value) && (
                      <button
                        onClick={() => setFilters({})}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filterColumns.map(column => {
                      const stat = columnStats.find(s => s.column === column);
                      const isNumeric = stat?.type === 'numeric';
                      const isDate = column.toLowerCase().includes('date') || column.toLowerCase().includes('تاريخ');
                      const uniqueValues = uniqueValuesCache[column] || [];
                      const hasLimitedValues = uniqueValues.length <= 50;
                      const currentFilter = filters[column] || { column, operator: 'equals', value: '' };

                      return (
                        <div key={column} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-200 truncate" title={column}>
                              {column}
                            </label>
                            {stat && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                isNumeric ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {isNumeric ? '123' : 'ABC'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {/* Operator selector for numeric/date columns */}
                            {(isNumeric || isDate) && !hasLimitedValues && (
                              <select
                                value={currentFilter.operator}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, operator: e.target.value as any, value: '', value2: '' }
                                })}
                                className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="equals">=  Equals</option>
                                <option value="greaterThan">&gt; Greater Than</option>
                                <option value="lessThan">&lt; Less Than</option>
                                <option value="between">⟷ Between</option>
                                {!isNumeric && <option value="contains">Contains</option>}
                              </select>
                            )}

                            {/* Date range inputs */}
                            {isDate && currentFilter.operator === 'between' ? (
                              <div className="space-y-2">
                                <input
                                  type="date"
                                  value={currentFilter.value || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                                  placeholder="From"
                                />
                                <input
                                  type="date"
                                  value={currentFilter.value2 || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value2: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                                  placeholder="To"
                                />
                              </div>
                            ) : isDate ? (
                              <input
                                type="date"
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : /* Numeric range inputs */
                            isNumeric && currentFilter.operator === 'between' ? (
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  placeholder="Min"
                                  value={currentFilter.value || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                  type="number"
                                  placeholder="Max"
                                  value={currentFilter.value2 || ''}
                                  onChange={(e) => setFilters({
                                    ...filters,
                                    [column]: { ...currentFilter, value2: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            ) : /* Dropdown for limited unique values */
                            hasLimitedValues ? (
                              <select
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { column, operator: 'equals', value: e.target.value } as FilterCondition
                                })}
                                className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">All ({uniqueValues.length})</option>
                                {uniqueValues.map((val: any) => (
                                  <option key={val} value={val}>
                                    {String(val).substring(0, 30)}{String(val).length > 30 ? '...' : ''}
                                  </option>
                                ))}
                              </select>
                            ) : /* Text input for other cases */
                            isNumeric ? (
                              <input
                                type="number"
                                placeholder="Enter value..."
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { ...currentFilter, value: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder="Search..."
                                value={currentFilter.value || ''}
                                onChange={(e) => setFilters({
                                  ...filters,
                                  [column]: { column, operator: 'contains', value: e.target.value } as FilterCondition
                                })}
                                className="w-full px-3 py-2 bg-slate-700/70 border border-indigo-500/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                              />
                            )}

                            {/* Active filter indicator */}
                            {currentFilter.value && (
                              <button
                                onClick={() => {
                                  const newFilters = { ...filters };
                                  delete newFilters[column];
                                  setFilters(newFilters);
                                }}
                                className="w-full px-2 py-1 bg-indigo-500/20 hover:bg-red-500/20 text-indigo-300 hover:text-red-300 rounded text-xs font-medium transition-colors"
                              >
                                ✕ Clear
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More/Less Filters Button */}
                  {columns.length > 6 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setShowAllFilters(!showAllFilters)}
                        className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30"
                      >
                        {showAllFilters ? `Show Less Filters (${filterColumns.length})` : `Show All Filters (${columns.length})`}
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {filteredRecords.length > 0 && (
                    <table className="min-w-full divide-y divide-indigo-500/20">
                      <thead className="bg-slate-800/50">
                        <tr>
                          {tableHeaders.map((key) => (
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
                        {paginatedData.map((record, idx) => (
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
                  {filteredRecords.length > rowsPerPage && (
                    <div className="flex items-center justify-between mt-4 px-4">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-400">
                          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length.toLocaleString()} rows
                        </p>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-slate-800 text-white border border-indigo-500/30 rounded px-2 py-1 text-sm"
                        >
                          <option value={25}>25 rows</option>
                          <option value={50}>50 rows</option>
                          <option value={100}>100 rows</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-300">
                          Page {currentPage} of {Math.ceil(filteredRecords.length / rowsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(Math.ceil(filteredRecords.length / rowsPerPage), currentPage + 1))}
                          disabled={currentPage >= Math.ceil(filteredRecords.length / rowsPerPage)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
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
                  {/* Chart Mode Selector */}
                  <div className="mb-6 flex items-center justify-center space-x-4 pb-4 border-b border-indigo-500/20">
                    <button
                      onClick={() => {
                        setChartMode('numeric');
                        setSecondCategoryColumn('');
                      }}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        chartMode === 'numeric'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      📊 Numeric Analysis
                      <p className="text-xs mt-1 opacity-80">Text vs Number</p>
                    </button>
                    <button
                      onClick={() => {
                        setChartMode('categorical');
                        setValueColumn('');
                      }}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        chartMode === 'categorical'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      🏷️ Categorical Analysis
                      <p className="text-xs mt-1 opacity-80">Text vs Text</p>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Column (Text Data) - Always visible */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Primary Category <span className="text-red-400">*</span>
                      </label>
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
                      <p className="text-xs text-gray-400 mt-1">Main grouping (X-axis)</p>
                    </div>

                    {/* Conditional: Numeric mode shows Value Column, Categorical mode shows Second Category */}
                    {chartMode === 'numeric' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Value (Numeric) <span className="text-red-400">*</span>
                        </label>
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
                        <p className="text-xs text-gray-400 mt-1">Numeric data (Y-axis)</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Second Category <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={secondCategoryColumn}
                          onChange={(e) => setSecondCategoryColumn(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select category...</option>
                          {columnStats.filter(stat => stat.type === 'text' && stat.column !== categoryColumn).map(stat => (
                            <option key={stat.column} value={stat.column}>{stat.column}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Count by category</p>
                      </div>
                    )}

                    {/* Aggregation Function - Only for numeric mode */}
                    {chartMode === 'numeric' && (
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
                    )}

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
                  {categoryColumn && ((chartMode === 'numeric' && valueColumn) || (chartMode === 'categorical' && secondCategoryColumn)) && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                      <p className="text-sm text-indigo-300">
                        <span className="font-semibold">Chart:</span>{' '}
                        {chartMode === 'numeric' ? (
                          <>
                            {aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} of{' '}
                            <span className="font-semibold">{valueColumn}</span> grouped by{' '}
                            <span className="font-semibold">{categoryColumn}</span>
                          </>
                        ) : (
                          <>
                            Count of <span className="font-semibold">{secondCategoryColumn}</span> grouped by{' '}
                            <span className="font-semibold">{categoryColumn}</span>
                          </>
                        )}
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
                  {categoryColumn && ((chartMode === 'numeric' && valueColumn) || (chartMode === 'categorical' && secondCategoryColumn)) ? renderChart() : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg font-semibold mb-2">Select data to visualize</p>
                      <p className="text-gray-500 text-sm">
                        {chartMode === 'numeric'
                          ? 'Choose a category column and a numeric value column to create your chart'
                          : 'Choose two category columns to analyze their relationship'}
                      </p>
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
                        <ResponsiveContainer width="100%" height={150}>
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
                            <Bar dataKey="value" fill="#6366f1" animationDuration={200} isAnimationActive={false} />
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
              <div className="space-y-6">
                {/* Summary KPIs */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-indigo-400" />
                    Dataset Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Records KPI */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-blue-300">Total Records</h3>
                        <Table2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{COUNT(filteredRecords.map(r => r.data)).toLocaleString()}</p>
                      <p className="text-xs text-blue-300 mt-1">
                        {filteredRecords.length !== dataset.records.length && (
                          <span>Filtered from {dataset.records.length.toLocaleString()}</span>
                        )}
                        {filteredRecords.length === dataset.records.length && (
                          <span>Total rows in dataset</span>
                        )}
                      </p>
                    </div>

                    {/* Total Columns */}
                    <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-indigo-300">Columns</h3>
                        <Grid3X3 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">{columns.length}</p>
                      <p className="text-xs text-indigo-300 mt-1">
                        {columnStats.filter(s => s.type === 'numeric').length} numeric, {columnStats.filter(s => s.type === 'text').length} text
                      </p>
                    </div>

                    {/* Data Completeness */}
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-300">Data Quality</h3>
                        <Activity className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {(() => {
                          const totalCells = filteredRecords.length * columns.length;
                          const nullCells = columnStats.reduce((sum, stat) => sum + stat.nullCount, 0);
                          const completeness = ((totalCells - nullCells) / totalCells * 100);
                          return completeness.toFixed(1);
                        })()}%
                      </p>
                      <p className="text-xs text-green-300 mt-1">Completeness rate</p>
                    </div>

                    {/* Unique Values */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-purple-300">Uniqueness</h3>
                        <Filter className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {(() => {
                          const avgUniqueness = columnStats.length > 0
                            ? columnStats.reduce((sum, stat) => sum + (stat.unique / stat.count), 0) / columnStats.length * 100
                            : 0;
                          return avgUniqueness.toFixed(0);
                        })()}%
                      </p>
                      <p className="text-xs text-purple-300 mt-1">Avg unique values</p>
                    </div>
                  </div>
                </div>

                {/* Numeric Column KPIs */}
                {columnStats.filter(stat => stat.type === 'numeric').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-indigo-400" />
                      Numeric Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {columnStats.filter(stat => stat.type === 'numeric').map((stat, idx) => {
                        const records = filteredRecords.map(r => r.data);
                        const sum = SUM(records, stat.column);
                        const avg = AVERAGE(records, stat.column);
                        const min = MIN(records, stat.column);
                        const max = MAX(records, stat.column);
                        const distinct = DISTINCTCOUNT(records, stat.column);

                        const colors = [
                          { from: 'purple-500', to: 'purple-600', text: 'purple-300', textBold: 'purple-400', border: 'purple-500' },
                          { from: 'green-500', to: 'green-600', text: 'green-300', textBold: 'green-400', border: 'green-500' },
                          { from: 'orange-500', to: 'orange-600', text: 'orange-300', textBold: 'orange-400', border: 'orange-500' },
                          { from: 'pink-500', to: 'pink-600', text: 'pink-300', textBold: 'pink-400', border: 'pink-500' },
                          { from: 'cyan-500', to: 'cyan-600', text: 'cyan-300', textBold: 'cyan-400', border: 'cyan-500' },
                          { from: 'yellow-500', to: 'yellow-600', text: 'yellow-300', textBold: 'yellow-400', border: 'yellow-500' },
                          { from: 'indigo-500', to: 'indigo-600', text: 'indigo-300', textBold: 'indigo-400', border: 'indigo-500' },
                          { from: 'red-500', to: 'red-600', text: 'red-300', textBold: 'red-400', border: 'red-500' }
                        ];
                        const color = colors[idx % colors.length];

                        return (
                          <div key={stat.column} className={`bg-gradient-to-br from-${color.from}/20 to-${color.to}/20 border border-${color.border}/30 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className={`text-sm font-semibold text-${color.text}`}>{stat.column}</h3>
                              <Activity className={`w-5 h-5 text-${color.textBold}`} />
                            </div>
                            <div className="space-y-3">
                              <div className="border-b border-gray-700/50 pb-2">
                                <p className="text-xs text-gray-400 mb-1">Total Sum</p>
                                <p className="text-2xl font-bold text-white">{sum.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-gray-400 mb-1">Average</p>
                                  <p className="text-white font-bold">{avg.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-gray-400 mb-1">Distinct</p>
                                  <p className="text-white font-bold">{distinct.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-gray-400 mb-1">Minimum</p>
                                  <p className="text-white font-bold">{min.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-gray-400 mb-1">Maximum</p>
                                  <p className="text-white font-bold">{max.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                                </div>
                              </div>
                              {stat.mean && stat.stdDev && (
                                <div className="bg-slate-800/50 rounded-lg p-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Std Dev</span>
                                    <span className="text-white font-bold">{stat.stdDev.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-gray-400">Variance</span>
                                    <span className="text-white font-bold">{(stat.stdDev * stat.stdDev).toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Text Column KPIs */}
                {columnStats.filter(stat => stat.type === 'text').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Table2 className="w-5 h-5 mr-2 text-indigo-400" />
                      Text Column Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {columnStats.filter(stat => stat.type === 'text').map((stat, idx) => {
                        const records = filteredRecords.map(r => r.data);
                        const distinct = DISTINCTCOUNT(records, stat.column);
                        const uniquenessPercent = (distinct / stat.count * 100).toFixed(1);

                        return (
                          <div key={stat.column} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
                            <h4 className="text-sm font-semibold text-indigo-300 mb-3">{stat.column}</h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-400 mb-1">Total Values</p>
                                <p className="text-white font-bold text-lg">{stat.count.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Unique</p>
                                <p className="text-white font-bold text-lg">{distinct.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Null/Empty</p>
                                <p className="text-white font-bold text-lg">{stat.nullCount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Uniqueness</p>
                                <p className="text-white font-bold text-lg">{uniquenessPercent}%</p>
                              </div>
                            </div>
                            {stat.minLength !== undefined && stat.maxLength !== undefined && (
                              <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-400">Min Length</span>
                                  <span className="text-white font-semibold">{stat.minLength}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                  <span className="text-gray-400">Max Length</span>
                                  <span className="text-white font-semibold">{stat.maxLength}</span>
                                </div>
                                {stat.avgLength && (
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-400">Avg Length</span>
                                    <span className="text-white font-semibold">{stat.avgLength.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {columnStats.filter(stat => stat.type === 'numeric').length === 0 && columnStats.filter(stat => stat.type === 'text').length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg font-semibold mb-2">No columns found</p>
                    <p className="text-gray-500 text-sm">Upload a dataset to see KPI metrics</p>
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
