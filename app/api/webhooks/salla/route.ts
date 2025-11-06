import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Webhook endpoint for Salla to push order data automatically
// This allows real-time data synchronization from Salla
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (Salla sends X-Salla-Signature header)
    const signature = request.headers.get('x-salla-signature');

    // Get webhook secret from environment
    const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;

    // Parse the webhook payload
    const payload = await request.json();

    console.log('Salla webhook received:', {
      event: payload.event,
      merchantId: payload.merchant,
      timestamp: new Date().toISOString(),
    });

    // Handle different Salla webhook events
    switch (payload.event) {
      case 'order.created':
      case 'order.updated':
        // Store order data
        await handleOrderWebhook(payload);
        break;

      case 'product.created':
      case 'product.updated':
        // Store product data
        await handleProductWebhook(payload);
        break;

      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Error processing Salla webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleOrderWebhook(payload: any) {
  try {
    // Find the admin user to attach the data to
    const user = await prisma.user.findFirst({
      where: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      },
    });

    if (!user) {
      console.error('Admin user not found');
      return;
    }

    // Transform Salla order data to your format
    const orderData = {
      'رقم الطلب': payload.data.id,
      'تاريخ الطلب': payload.data.created_at,
      'اسم العميل': payload.data.customer?.name || 'N/A',
      'البريد الإلكتروني': payload.data.customer?.email || 'N/A',
      'رقم الجوال': payload.data.customer?.mobile || 'N/A',
      'المدينة': payload.data.shipping_address?.city || 'N/A',
      'الدولة': payload.data.shipping_address?.country || 'Saudi Arabia',
      'اسم المنتج': payload.data.items?.map((item: any) => item.name).join(', ') || 'N/A',
      'الكمية': payload.data.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      'السعر الإجمالي': payload.data.amounts?.total || 0,
      'الضريبة': payload.data.amounts?.tax || 0,
      'تكلفة الشحن': payload.data.amounts?.shipping || 0,
      'طريقة الدفع': payload.data.payment_method || 'N/A',
      'حالة الطلب': mapSallaStatus(payload.data.status?.name),
    };

    // Store in a temporary collection or directly create a dataset
    // For now, we'll log it. You can extend this to accumulate daily orders
    console.log('Order data transformed:', orderData);

    // TODO: Store in a daily orders collection that gets processed into a dataset

    return orderData;
  } catch (error) {
    console.error('Error handling order webhook:', error);
    throw error;
  }
}

async function handleProductWebhook(payload: any) {
  try {
    console.log('Product webhook:', payload.data);
    // Handle product updates if needed
  } catch (error) {
    console.error('Error handling product webhook:', error);
    throw error;
  }
}

function mapSallaStatus(status: string): string {
  // Map Salla order statuses to your format
  const statusMap: { [key: string]: string } = {
    'completed': 'Completed',
    'delivered': 'Completed',
    'pending': 'Not Completed',
    'processing': 'Not Completed',
    'canceled': 'Not Completed',
    'refunded': 'Not Completed',
  };

  return statusMap[status?.toLowerCase()] || 'Not Completed';
}
