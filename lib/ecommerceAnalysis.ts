// E-Commerce Analytics Library
// Specialized analysis functions for e-commerce data

interface DataRow {
  [key: string]: any;
}

// ===== REVENUE & SALES ANALYTICS =====

export function calculateRevenueMetrics(data: DataRow[], revenueColumn: string, dateColumn: string) {
  const revenues = data.map(row => parseFloat(row[revenueColumn] || 0)).filter(v => !isNaN(v));

  const totalRevenue = revenues.reduce((sum, val) => sum + val, 0);
  const averageOrderValue = totalRevenue / revenues.length;
  const minOrder = Math.min(...revenues);
  const maxOrder = Math.max(...revenues);

  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders: revenues.length,
    averageOrderValue: averageOrderValue.toFixed(2),
    minOrder: minOrder.toFixed(2),
    maxOrder: maxOrder.toFixed(2),
  };
}

export function calculateRevenueTrends(data: DataRow[], revenueColumn: string, dateColumn: string) {
  // Group by date and calculate daily revenue
  const revenueByDate: Record<string, number> = {};

  data.forEach(row => {
    const date = row[dateColumn];
    const revenue = parseFloat(row[revenueColumn] || 0);

    if (date && !isNaN(revenue)) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + revenue;
    }
  });

  const sortedDates = Object.keys(revenueByDate).sort();
  const trends = sortedDates.map(date => ({
    date,
    revenue: revenueByDate[date].toFixed(2),
  }));

  // Calculate growth
  if (trends.length >= 2) {
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));

    const firstAvg = firstHalf.reduce((sum, t) => sum + parseFloat(t.revenue), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + parseFloat(t.revenue), 0) / secondHalf.length;
    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      trends: trends.slice(-30), // Last 30 data points
      growthRate: growthRate.toFixed(2) + '%',
      direction: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable',
    };
  }

  return {
    trends: trends.slice(-30),
    growthRate: '0%',
    direction: 'stable',
  };
}

// ===== PRODUCT PERFORMANCE ANALYTICS =====

export function analyzeProductPerformance(data: DataRow[], productColumn: string, revenueColumn: string, quantityColumn?: string) {
  const productStats: Record<string, { revenue: number; quantity: number; orders: number }> = {};

  data.forEach(row => {
    const product = row[productColumn];
    const revenue = parseFloat(row[revenueColumn] || 0);
    const quantity = quantityColumn ? parseFloat(row[quantityColumn] || 1) : 1;

    if (product && !isNaN(revenue)) {
      if (!productStats[product]) {
        productStats[product] = { revenue: 0, quantity: 0, orders: 0 };
      }
      productStats[product].revenue += revenue;
      productStats[product].quantity += quantity;
      productStats[product].orders += 1;
    }
  });

  const products = Object.entries(productStats).map(([name, stats]) => ({
    product: name,
    revenue: stats.revenue.toFixed(2),
    quantity: stats.quantity,
    orders: stats.orders,
    averagePrice: (stats.revenue / stats.quantity).toFixed(2),
  }));

  // Sort by revenue
  products.sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

  return {
    topProducts: products.slice(0, 10),
    bottomProducts: products.slice(-5).reverse(),
    totalProducts: products.length,
  };
}

// ===== RFM ANALYSIS (Customer Segmentation) =====

export function performRFMAnalysis(data: DataRow[], customerColumn: string, dateColumn: string, revenueColumn: string) {
  const today = new Date();
  const customerData: Record<string, { lastPurchase: Date; frequency: number; monetary: number }> = {};

  data.forEach(row => {
    const customer = row[customerColumn];
    const date = new Date(row[dateColumn]);
    const revenue = parseFloat(row[revenueColumn] || 0);

    if (customer && !isNaN(date.getTime()) && !isNaN(revenue)) {
      if (!customerData[customer]) {
        customerData[customer] = { lastPurchase: date, frequency: 0, monetary: 0 };
      }

      if (date > customerData[customer].lastPurchase) {
        customerData[customer].lastPurchase = date;
      }
      customerData[customer].frequency += 1;
      customerData[customer].monetary += revenue;
    }
  });

  // Calculate RFM scores
  const customers = Object.entries(customerData).map(([name, data]) => {
    const recency = Math.floor((today.getTime() - data.lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
    return {
      customer: name,
      recency,
      frequency: data.frequency,
      monetary: data.monetary.toFixed(2),
    };
  });

  // Calculate quartiles for scoring
  const recencies = customers.map(c => c.recency).sort((a, b) => a - b);
  const frequencies = customers.map(c => c.frequency).sort((a, b) => a - b);
  const monetaries = customers.map(c => parseFloat(c.monetary)).sort((a, b) => a - b);

  const getQuartile = (arr: number[], value: number) => {
    const index = arr.indexOf(value);
    const quartile = Math.ceil((index / arr.length) * 4);
    return Math.max(1, Math.min(4, quartile));
  };

  // Assign RFM scores and segments
  const scoredCustomers = customers.map(c => {
    const rScore = 5 - getQuartile(recencies, c.recency); // Reverse for recency (lower days = better)
    const fScore = getQuartile(frequencies, c.frequency);
    const mScore = getQuartile(monetaries, parseFloat(c.monetary));

    let segment = 'Other';
    if (rScore >= 4 && fScore >= 4 && mScore >= 4) segment = 'Champions';
    else if (rScore >= 3 && fScore >= 3 && mScore >= 3) segment = 'Loyal Customers';
    else if (rScore >= 4 && fScore <= 2) segment = 'New Customers';
    else if (rScore <= 2 && fScore >= 3) segment = 'At Risk';
    else if (rScore <= 2 && fScore <= 2) segment = 'Lost Customers';
    else if (fScore >= 4) segment = 'Big Spenders';

    return {
      customer: c.customer,
      recency: c.recency,
      frequency: c.frequency,
      monetary: c.monetary,
      rScore,
      fScore,
      mScore,
      segment,
    };
  });

  // Count segments
  const segmentCounts: Record<string, number> = {};
  scoredCustomers.forEach(c => {
    segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1;
  });

  return {
    customers: scoredCustomers.slice(0, 100), // Top 100 for display
    segmentCounts,
    totalCustomers: scoredCustomers.length,
  };
}

// ===== CUSTOMER METRICS =====

export function analyzeCustomerMetrics(data: DataRow[], customerColumn: string, revenueColumn: string) {
  const customerRevenue: Record<string, number> = {};
  const customerOrders: Record<string, number> = {};

  data.forEach(row => {
    const customer = row[customerColumn];
    const revenue = parseFloat(row[revenueColumn] || 0);

    if (customer && !isNaN(revenue)) {
      customerRevenue[customer] = (customerRevenue[customer] || 0) + revenue;
      customerOrders[customer] = (customerOrders[customer] || 0) + 1;
    }
  });

  const customers = Object.keys(customerRevenue);
  const totalCustomers = customers.length;

  // New vs Returning (customers with 1 order vs multiple)
  const newCustomers = customers.filter(c => customerOrders[c] === 1).length;
  const returningCustomers = totalCustomers - newCustomers;

  // Customer Lifetime Value
  const revenues = Object.values(customerRevenue);
  const avgCLV = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;

  // Repeat purchase rate
  const repeatPurchaseRate = (returningCustomers / totalCustomers) * 100;

  // Top customers
  const topCustomers = Object.entries(customerRevenue)
    .map(([name, revenue]) => ({
      customer: name,
      revenue: revenue.toFixed(2),
      orders: customerOrders[name],
    }))
    .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
    .slice(0, 10);

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    newCustomerPercent: ((newCustomers / totalCustomers) * 100).toFixed(2) + '%',
    returningCustomerPercent: ((returningCustomers / totalCustomers) * 100).toFixed(2) + '%',
    averageCLV: avgCLV.toFixed(2),
    repeatPurchaseRate: repeatPurchaseRate.toFixed(2) + '%',
    topCustomers,
  };
}

// ===== COHORT ANALYSIS =====

export function performCohortAnalysis(data: DataRow[], customerColumn: string, dateColumn: string, revenueColumn: string) {
  // Find first purchase date for each customer
  const customerFirstPurchase: Record<string, string> = {};

  data.forEach(row => {
    const customer = row[customerColumn];
    const date = new Date(row[dateColumn]);

    if (customer && !isNaN(date.getTime())) {
      const dateStr = date.toISOString().split('T')[0];
      if (!customerFirstPurchase[customer] || dateStr < customerFirstPurchase[customer]) {
        customerFirstPurchase[customer] = dateStr;
      }
    }
  });

  // Group customers by cohort (first purchase month)
  const cohorts: Record<string, { customers: Set<string>; revenue: number }> = {};

  Object.entries(customerFirstPurchase).forEach(([customer, date]) => {
    const cohort = date.substring(0, 7); // YYYY-MM
    if (!cohorts[cohort]) {
      cohorts[cohort] = { customers: new Set(), revenue: 0 };
    }
    cohorts[cohort].customers.add(customer);
  });

  // Calculate cohort revenue
  data.forEach(row => {
    const customer = row[customerColumn];
    const revenue = parseFloat(row[revenueColumn] || 0);

    if (customer && !isNaN(revenue) && customerFirstPurchase[customer]) {
      const cohort = customerFirstPurchase[customer].substring(0, 7);
      if (cohorts[cohort]) {
        cohorts[cohort].revenue += revenue;
      }
    }
  });

  const cohortStats = Object.entries(cohorts)
    .map(([month, data]) => ({
      cohort: month,
      customers: data.customers.size,
      revenue: data.revenue.toFixed(2),
      avgRevenuePerCustomer: (data.revenue / data.customers.size).toFixed(2),
    }))
    .sort((a, b) => a.cohort.localeCompare(b.cohort));

  return {
    cohorts: cohortStats.slice(-12), // Last 12 cohorts
    totalCohorts: cohortStats.length,
  };
}

// ===== SALES FORECASTING (Simple Linear Regression) =====

export function forecastRevenue(data: DataRow[], dateColumn: string, revenueColumn: string, daysAhead: number = 30) {
  // Group by date
  const revenueByDate: Record<string, number> = {};

  data.forEach(row => {
    const date = row[dateColumn];
    const revenue = parseFloat(row[revenueColumn] || 0);

    if (date && !isNaN(revenue)) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + revenue;
    }
  });

  const sortedDates = Object.keys(revenueByDate).sort();
  if (sortedDates.length < 7) {
    return {
      forecast: [],
      error: 'Need at least 7 days of data for forecasting',
    };
  }

  // Convert to numeric series
  const series = sortedDates.map((date, idx) => ({
    x: idx,
    y: revenueByDate[date],
  }));

  // Simple linear regression
  const n = series.length;
  const sumX = series.reduce((sum, p) => sum + p.x, 0);
  const sumY = series.reduce((sum, p) => sum + p.y, 0);
  const sumXY = series.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = series.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecast
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const forecast = [];

  for (let i = 1; i <= daysAhead; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    const x = n + i - 1;
    const predictedRevenue = slope * x + intercept;

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedRevenue: Math.max(0, predictedRevenue).toFixed(2),
    });
  }

  return {
    forecast: forecast.slice(0, 30), // Max 30 days
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    growthRate: ((slope / (sumY / n)) * 100).toFixed(2) + '%',
  };
}

// ===== AUTO-DETECT COLUMN TYPES =====

export function detectEcommerceColumns(data: DataRow[]) {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const detected: Record<string, string> = {};

  // Arabic column mappings (exact match)
  const arabicMappings: Record<string, string> = {
    'تاريخ الطلب': 'dateColumn',
    'اجمالي الطلب': 'revenueColumn',
    'اسماء المنتجات مع SKU': 'productColumn',
    'طريقة الدفع': 'paymentColumn',
    'الضريبة': 'vatColumn',
    'المدينة': 'cityColumn',
    'الدولة': 'countryColumn',
  };

  // Common English patterns for detection
  const patterns = {
    date: /date|time|created|ordered|purchased|تاريخ/i,
    revenue: /revenue|total|amount|price|value|sales|اجمالي|إجمالي/i,
    customer: /customer|client|user|buyer|عميل|زبون/i,
    product: /product|item|sku|name|منتج|اسماء/i,
    quantity: /quantity|qty|count|units|كمية|عدد/i,
    category: /category|type|department|فئة|قسم/i,
    payment: /payment|method|طريقة/i,
    vat: /vat|tax|ضريبة/i,
    city: /city|مدينة/i,
    country: /country|دولة/i,
  };

  columns.forEach(col => {
    // Check for exact Arabic match first
    if (arabicMappings[col]) {
      detected[arabicMappings[col]] = col;
      return;
    }

    // Fallback to pattern matching
    const lower = col.toLowerCase();
    if (patterns.date.test(lower)) detected.dateColumn = col;
    if (patterns.revenue.test(lower)) detected.revenueColumn = col;
    if (patterns.customer.test(lower)) detected.customerColumn = col;
    if (patterns.product.test(lower)) detected.productColumn = col;
    if (patterns.quantity.test(lower)) detected.quantityColumn = col;
    if (patterns.category.test(lower)) detected.categoryColumn = col;
    if (patterns.payment.test(lower)) detected.paymentColumn = col;
    if (patterns.vat.test(lower)) detected.vatColumn = col;
    if (patterns.city.test(lower)) detected.cityColumn = col;
    if (patterns.country.test(lower)) detected.countryColumn = col;
  });

  return detected;
}

// ===== DATA CLEANING & TRANSFORMATION =====

export function cleanEcommerceData(data: DataRow[], detectedColumns: Record<string, string>): DataRow[] {
  return data.map(row => {
    const cleanedRow = { ...row };

    // Clean product name: Remove SKU (anything after " - " or in parentheses)
    if (detectedColumns.productColumn) {
      const productValue = cleanedRow[detectedColumns.productColumn];
      if (productValue && typeof productValue === 'string') {
        // Remove SKU patterns like " - SKU123" or " (SKU123)" or " SKU: 123"
        let cleanProduct = productValue
          .replace(/\s*-\s*SKU[:\s]*.*/i, '')  // Remove " - SKU: xxx"
          .replace(/\s*\(SKU[:\s]*.*?\)/i, '') // Remove " (SKU: xxx)"
          .replace(/\s*SKU[:\s]*.*/i, '')      // Remove " SKU: xxx"
          .replace(/\s*-\s*\d+\s*$/, '')       // Remove trailing " - 123"
          .trim();

        cleanedRow[detectedColumns.productColumn] = cleanProduct;
      }
    }

    // Fill blank city fields with "N/A"
    if (detectedColumns.cityColumn) {
      const cityValue = cleanedRow[detectedColumns.cityColumn];
      if (!cityValue || cityValue === '' || cityValue === null || cityValue === undefined) {
        cleanedRow[detectedColumns.cityColumn] = 'N/A';
      }
    }

    return cleanedRow;
  });
}
