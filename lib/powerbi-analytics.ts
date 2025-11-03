// Power BI-level Analytics Utilities
// DAX-like measures and advanced analytics functions

export interface Measure {
  name: string;
  formula: string;
  type: 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
  format?: 'number' | 'currency' | 'percentage';
}

export interface FilterCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
  value2?: any; // For 'between' operator
}

// DAX-like SUM function
export function SUM(data: any[], column: string): number {
  return data.reduce((sum, row) => {
    const value = parseFloat(row[column]);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

// DAX-like AVERAGE function
export function AVERAGE(data: any[], column: string): number {
  const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// DAX-like COUNT function
export function COUNT(data: any[], column?: string): number {
  if (!column) return data.length;
  return data.filter(row => row[column] !== null && row[column] !== undefined).length;
}

// DAX-like DISTINCTCOUNT function
export function DISTINCTCOUNT(data: any[], column: string): number {
  return new Set(data.map(row => row[column])).size;
}

// DAX-like MIN/MAX functions
export function MIN(data: any[], column: string): number {
  const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
  return values.length > 0 ? Math.min(...values) : 0;
}

export function MAX(data: any[], column: string): number {
  const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
  return values.length > 0 ? Math.max(...values) : 0;
}

// Advanced filtering with multiple operators
export function applyAdvancedFilters(data: any[], filters: FilterCondition[]): any[] {
  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];

      switch (filter.operator) {
        case 'equals':
          return String(value).toLowerCase() === String(filter.value).toLowerCase();

        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());

        case 'greaterThan':
          return parseFloat(value) > parseFloat(filter.value);

        case 'lessThan':
          return parseFloat(value) < parseFloat(filter.value);

        case 'between':
          const numValue = parseFloat(value);
          return numValue >= parseFloat(filter.value) && numValue <= parseFloat(filter.value2!);

        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);

        default:
          return true;
      }
    });
  });
}

// Get unique values for a column (for dropdown filters)
export function getUniqueValues(data: any[], column: string): any[] {
  const values = data.map(row => row[column]);
  return Array.from(new Set(values)).sort();
}

// Calculate percentage change (KPI)
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Prepare data for treemap
export function prepareTreemapData(data: any[], categoryColumn: string, valueColumn: string) {
  const grouped: Record<string, number> = {};

  data.forEach(row => {
    const category = String(row[categoryColumn] || 'Unknown');
    const value = parseFloat(row[valueColumn]) || 0;
    grouped[category] = (grouped[category] || 0) + value;
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value, size: value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20); // Top 20 categories
}

// Prepare data for heatmap/matrix
export function prepareHeatmapData(
  data: any[],
  xColumn: string,
  yColumn: string,
  valueColumn: string
) {
  const matrix: Record<string, Record<string, number>> = {};

  data.forEach(row => {
    const x = String(row[xColumn] || 'Unknown');
    const y = String(row[yColumn] || 'Unknown');
    const value = parseFloat(row[valueColumn]) || 0;

    if (!matrix[y]) matrix[y] = {};
    matrix[y][x] = (matrix[y][x] || 0) + value;
  });

  // Convert to array format for recharts
  const result: any[] = [];
  Object.entries(matrix).forEach(([yKey, xValues]) => {
    const row: any = { name: yKey };
    Object.entries(xValues).forEach(([xKey, value]) => {
      row[xKey] = value;
    });
    result.push(row);
  });

  return result;
}

// Calculate quartiles for box plots
export function calculateQuartiles(data: any[], column: string) {
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(v => !isNaN(v))
    .sort((a, b) => a - b);

  if (values.length === 0) return { q1: 0, median: 0, q3: 0, min: 0, max: 0 };

  const q1Index = Math.floor(values.length * 0.25);
  const medianIndex = Math.floor(values.length * 0.5);
  const q3Index = Math.floor(values.length * 0.75);

  return {
    min: values[0],
    q1: values[q1Index],
    median: values[medianIndex],
    q3: values[q3Index],
    max: values[values.length - 1]
  };
}

// Group by and aggregate (like Power BI's group by)
export function groupByAndAggregate(
  data: any[],
  groupByColumns: string[],
  aggregations: { column: string; operation: 'sum' | 'avg' | 'count' | 'min' | 'max' }[]
) {
  const groups: Record<string, any[]> = {};

  // Group data
  data.forEach(row => {
    const key = groupByColumns.map(col => row[col]).join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  // Aggregate
  return Object.entries(groups).map(([key, rows]) => {
    const result: any = {};

    // Add group by columns
    groupByColumns.forEach((col, index) => {
      result[col] = key.split('|')[index];
    });

    // Add aggregations
    aggregations.forEach(agg => {
      const columnName = `${agg.operation}_${agg.column}`;
      switch (agg.operation) {
        case 'sum':
          result[columnName] = SUM(rows, agg.column);
          break;
        case 'avg':
          result[columnName] = AVERAGE(rows, agg.column);
          break;
        case 'count':
          result[columnName] = COUNT(rows, agg.column);
          break;
        case 'min':
          result[columnName] = MIN(rows, agg.column);
          break;
        case 'max':
          result[columnName] = MAX(rows, agg.column);
          break;
      }
    });

    return result;
  });
}

// Export to SQL INSERT statements
export function exportToSQL(data: any[], tableName: string): string {
  if (data.length === 0) return '';

  const columns = Object.keys(data[0]);
  let sql = `-- SQL INSERT statements for ${tableName}\n\n`;

  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    });

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });

  return sql;
}

// Export to JSON
export function exportToJSON(data: any[], pretty: boolean = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

// Calculate running total (like Power BI's RUNNINGVALUE)
export function calculateRunningTotal(data: any[], valueColumn: string): any[] {
  let runningTotal = 0;
  return data.map(row => {
    runningTotal += parseFloat(row[valueColumn]) || 0;
    return { ...row, runningTotal };
  });
}

// Calculate moving average
export function calculateMovingAverage(data: any[], valueColumn: string, window: number): any[] {
  return data.map((row, index) => {
    const start = Math.max(0, index - window + 1);
    const windowData = data.slice(start, index + 1);
    const avg = AVERAGE(windowData, valueColumn);
    return { ...row, movingAverage: avg };
  });
}

// Rank data (like Power BI's RANKX)
export function rankData(data: any[], column: string, descending: boolean = true): any[] {
  const sorted = [...data].sort((a, b) => {
    const aVal = parseFloat(a[column]) || 0;
    const bVal = parseFloat(b[column]) || 0;
    return descending ? bVal - aVal : aVal - bVal;
  });

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}
