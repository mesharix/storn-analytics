// Data analysis utility functions

export interface ColumnStats {
  column: string;
  type: 'numeric' | 'text' | 'date' | 'boolean';
  count: number;
  unique: number;
  nullCount: number;
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  // Text stats
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
}

export function analyzeColumn(data: any[], columnName: string): ColumnStats {
  const values = data.map(row => (row as any)[columnName]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  const stats: ColumnStats = {
    column: columnName,
    type: 'text',
    count: values.length,
    unique: new Set(nonNullValues).size,
    nullCount: values.length - nonNullValues.length,
  };

  // Detect type and calculate stats

  // Check if column name suggests it's a date field
  const isDateColumn = /date|time|created|ordered|purchased|تاريخ/i.test(columnName);

  // Check if values look like dates
  const dateValues = nonNullValues.filter(v => {
    const str = String(v);
    // Check for common date patterns: YYYY-MM-DD, DD/MM/YYYY, timestamps, etc.
    return /^\d{4}-\d{2}-\d{2}/.test(str) ||
           /^\d{2}\/\d{2}\/\d{4}/.test(str) ||
           /^\d{2}-\d{2}-\d{4}/.test(str) ||
           !isNaN(Date.parse(str));
  });

  if (isDateColumn || dateValues.length > nonNullValues.length * 0.7) {
    // Date column
    stats.type = 'date';
    const lengths = nonNullValues.map(v => String(v).length);
    stats.minLength = Math.min(...lengths);
    stats.maxLength = Math.max(...lengths);
    stats.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  } else {
    // Check for numeric values
    const numericValues = nonNullValues
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (numericValues.length > nonNullValues.length * 0.8) {
      // Mostly numeric
      stats.type = 'numeric';
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      stats.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

      const sorted = [...numericValues].sort((a, b) => a - b);
      stats.median = sorted[Math.floor(sorted.length / 2)];

      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - stats.mean!, 2), 0) / numericValues.length;
      stats.stdDev = Math.sqrt(variance);
    } else {
      // Text data
      const lengths = nonNullValues.map(v => String(v).length);
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
      stats.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    }
  }

  return stats;
}

export function analyzeDataset(data: any[]) {
  if (!data || data.length === 0) {
    return { columnStats: [], rowCount: 0, columnCount: 0 };
  }

  const columns = Object.keys(data[0] as Record<string, any>);
  const columnStats = columns.map(col => analyzeColumn(data, col));

  return {
    rowCount: data.length,
    columnCount: columns.length,
    columnStats,
  };
}

export interface CorrelationResult {
  column1: string;
  column2: string;
  correlation: number;
}

export function calculateCorrelation(data: any[], col1: string, col2: string): number {
  const values1 = data.map(row => parseFloat((row as any)[col1])).filter(v => !isNaN(v));
  const values2 = data.map(row => parseFloat((row as any)[col2])).filter(v => !isNaN(v));

  if (values1.length !== values2.length || values1.length === 0) {
    return 0;
  }

  const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
  const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

  const numerator = values1.reduce((sum, val1, i) => {
    return sum + (val1 - mean1) * (values2[i] - mean2);
  }, 0);

  const denominator1 = Math.sqrt(values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0));
  const denominator2 = Math.sqrt(values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0));

  if (denominator1 === 0 || denominator2 === 0) {
    return 0;
  }

  return numerator / (denominator1 * denominator2);
}

export function findCorrelations(data: any[], threshold: number = 0.7): CorrelationResult[] {
  if (!data || data.length === 0) return [];

  const columns = Object.keys(data[0] as Record<string, any>);
  const numericColumns = columns.filter(col => {
    const values = data.map(row => parseFloat((row as any)[col]));
    const validCount = values.filter(v => !isNaN(v)).length;
    return validCount > data.length * 0.8;
  });

  const correlations: CorrelationResult[] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const correlation = calculateCorrelation(data, numericColumns[i], numericColumns[j]);
      if (Math.abs(correlation) >= threshold) {
        correlations.push({
          column1: numericColumns[i],
          column2: numericColumns[j],
          correlation,
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
