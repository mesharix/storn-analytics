import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint fetches orders from Salla and creates a dataset
// To be called by n8n on a schedule
export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sallaAccessToken, dateFrom, dateTo } = body;

    if (!sallaAccessToken) {
      return NextResponse.json(
        { error: 'Salla access token is required' },
        { status: 400 }
      );
    }

    // Fetch orders from Salla API
    const fromDate = dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
    const toDate = dateTo || new Date().toISOString();

    console.log('Fetching Salla orders from', fromDate, 'to', toDate);

    const sallaOrders = await fetchSallaOrders(sallaAccessToken, fromDate, toDate);

    if (sallaOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new orders found',
        orderCount: 0,
      });
    }

    // Transform Salla orders to your format
    const transformedOrders = sallaOrders.map((order: any) => ({
      'رقم الطلب': order.id?.toString() || '',
      'تاريخ الطلب': order.created_at || '',
      'اسم العميل': order.customer?.name || 'N/A',
      'البريد الإلكتروني': order.customer?.email || '',
      'رقم الجوال': order.customer?.mobile || '',
      'المدينة': order.shipping_address?.city || 'N/A',
      'الدولة': order.shipping_address?.country || 'Saudi Arabia',
      'اسماء المنتجات مع SKU': order.items?.map((item: any) =>
        `${item.name} - SKU: ${item.sku || 'N/A'}`
      ).join(', ') || 'N/A',
      'الكمية': order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
      'السعر الإجمالي': parseFloat(order.amounts?.total || '0'),
      'الضريبة': parseFloat(order.amounts?.tax || '0'),
      'تكلفة الشحن': parseFloat(order.amounts?.shipping_cost || '0'),
      'طريقة الدفع': order.payment_method || 'N/A',
      'حالة الطلب': mapSallaStatus(order.status?.name || ''),
    }));

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create dataset with transformed orders
    const dataset = await prisma.dataset.create({
      data: {
        name: `Salla Orders - ${new Date().toLocaleDateString('en-US')}`,
        description: `Imported from Salla on ${new Date().toLocaleString('en-US')}`,
        fileName: 'salla-import.csv',
        fileSize: JSON.stringify(transformedOrders).length,
        rowCount: transformedOrders.length,
        columnCount: Object.keys(transformedOrders[0] || {}).length,
        userId: user.id,
        isPublic: false,
        records: {
          create: transformedOrders.map(order => ({
            data: order,
          })),
        },
      },
    });

    console.log('Created dataset:', dataset.id, 'with', transformedOrders.length, 'orders');

    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        orderCount: transformedOrders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching Salla orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Salla orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function fetchSallaOrders(accessToken: string, fromDate: string, toDate: string) {
  try {
    const url = new URL('https://api.salla.dev/admin/v2/orders');
    url.searchParams.append('from', fromDate);
    url.searchParams.append('to', toDate);
    url.searchParams.append('per_page', '100'); // Adjust as needed

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salla API error:', response.status, errorText);
      throw new Error(`Salla API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error calling Salla API:', error);
    throw error;
  }
}

function mapSallaStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'completed': 'تم التنفيذ',
    'delivered': 'تم التنفيذ',
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'canceled': 'ملغي',
    'refunded': 'مسترجع',
  };

  return statusMap[status?.toLowerCase()] || status || 'N/A';
}

// GET endpoint to test Salla connection
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Salla integration endpoint',
    usage: 'POST with sallaAccessToken in body',
    requiredHeaders: 'x-api-key',
    optionalParams: {
      dateFrom: 'ISO date string',
      dateTo: 'ISO date string',
    },
  });
}
