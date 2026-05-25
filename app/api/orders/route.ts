import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvoice, updateInvoice, fetchInvoiceDetail } from '@/lib/services/orderService';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage, isDatabaseUnavailable } from '@/lib/api-errors';
import { isForeignKeyViolation, isUniqueViolation } from '@/lib/database/errors';

const measurementInputSchema = z.object({
  chest: z.number().optional(),
  waist: z.number().optional(),
  shoulder: z.number().optional(),
  sleeve: z.number().optional(),
  neck: z.number().optional(),
  hip: z.number().optional(),
  inseam: z.number().optional(),
  length: z.number().optional(),
  customNotes: z.string().optional(),
  photoUrl: z.string().optional(),
  photoFileId: z.string().optional(),
  photoName: z.string().optional(),
});

const orderItemSchema = z
  .object({
    fabricVariantId: z.string().optional(),
    meters: z.number().positive(),
    ratePerMeter: z.number().nonnegative(),
    stitchingPrice: z.number().nonnegative().default(0),
    discount: z.number().nonnegative().optional(),
    isNewVariant: z.boolean().optional(),
    newProductDetails: z
      .object({
        designName: z.string().min(1),
        category: z.string().min(1),
        color: z.string().min(1),
        purchasePricePerMeter: z.number().nonnegative(),
        initialStockMeters: z.number().nonnegative(),
      })
      .optional(),
    stitchTypeNames: z.array(z.string().min(1)).optional(),
    stitchAssignments: z.array(
      z.object({
        stitchTypeName: z.string().min(1),
        customerPrice: z.number().nonnegative(),
        tailors: z.array(
          z.object({
            tailorId: z.string().min(1),
            quantity: z.number().positive(),
            tailorPrice: z.number().nonnegative()
          })
        ).optional()
      })
    ).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isNewVariant && !data.newProductDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newProductDetails'],
        message: 'Product details required for new variants',
      });
    }
    if (!data.isNewVariant && !data.fabricVariantId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fabricVariantId'],
        message: 'Fabric variant ID is required unless creating a new variant',
      });
    }
  });

const customerInputSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

const orderSchema = z
  .object({
    customerId: z.string().optional(),
    customer: customerInputSchema.optional(),
    measurement: measurementInputSchema.optional(),
    walkIn: z.boolean().optional().default(false),
    invoiceNumber: z.string().min(1),
    discount: z.number().nonnegative().default(0),
    tax: z.number().nonnegative().default(0),
    advancePaid: z.number().nonnegative().default(0),
    paymentMethod: z.string().default('cash'),
    paymentStatus: z.string().default('paid'),
    isDraft: z.boolean().default(false),
    meta: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (!data.walkIn && !data.customerId && !data.customer?.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customer', 'phone'],
        message: 'Phone is required unless walk-in customer',
      });
    }
  });

const updatePaymentStatusSchema = z
  .object({
    paymentStatus: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((v) => !!(v.paymentStatus || v.status), {
    message: 'paymentStatus is required',
  });

function firstZodIssueMessage(error: z.ZodError<unknown>) {
  const first = error.issues?.[0];
  if (!first) return 'Invalid input';
  const path = first.path?.length ? `${first.path.join('.')}: ` : '';
  return `${path}${first.message}`;
}

function toOrderPublicError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (isUniqueViolation(error)) return { status: 409 as const, error: 'Invoice number already exists' };
  if (isForeignKeyViolation(error)) {
    return {
      status: 400 as const,
      error:
        'Selected product is not available in live inventory. Please re-select products and try again.',
    };
  }
  if (message.toLowerCase().includes('insufficient stock')) {
    return {
      status: 400 as const,
      error:
        'Stock is not enough for one or more selected products. Reduce meters or choose another product.',
    };
  }
  if (isDatabaseUnavailable(error)) {
    return {
      status: 503 as const,
      error: 'Database is temporarily unavailable. Please try again in a moment.',
    };
  }
  return { status: 500 as const, error: toPublicErrorMessage(error) };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    const status = url.searchParams.get('status') || '';
    const includeDraft = url.searchParams.get('includeDraft') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (orderId) {
      const invoice = await fetchInvoiceDetail(admin, orderId);
      if (!invoice) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: invoice });
    }

    let q = admin
      .from('invoices')
      .select('*, customer:customers(full_name, phone), items:invoice_items(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) q = q.eq('payment_status', status);
    if (!includeDraft) q = q.eq('is_draft', false);

    const { data: invoices, error, count } = await q;
    if (error) throw error;

    const rows = (invoices ?? []).map((inv: Record<string, unknown>) => {
      const items = inv.items as unknown[] | undefined;
      const cust = inv.customer as { full_name: string; phone: string } | null;
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        createdAt: new Date(inv.created_at as string).toISOString(),
        grandTotal: inv.grand_total,
        dueAmount: inv.due_amount ?? 0,
        advancePaid: inv.advance_paid ?? 0,
        isDraft: inv.is_draft ?? false,
        paymentStatus: inv.payment_status,
        paymentMethod: inv.payment_method,
        itemsCount: items?.length || 0,
        customer: cust ? { fullName: cust.full_name, phone: cust.phone } : null,
      };
    });

    return NextResponse.json({ success: true, data: rows, total: count ?? 0, limit, offset });
  } catch (error: unknown) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: firstZodIssueMessage(parsed.error),
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const invoice = await createInvoice(parsed.data);

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: unknown) {
    console.error('Orders POST error:', error);
    const mapped = toOrderPublicError(error);
    return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const parsed = updatePaymentStatusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: firstZodIssueMessage(parsed.error),
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const paymentStatus = parsed.data.paymentStatus ?? parsed.data.status!;
    const admin = createAdminClient();
    
    // Get current invoice to determine amounts
    const { data: currentInvoice, error: fetchErr } = await admin
      .from('invoices')
      .select('grand_total, advance_paid')
      .eq('id', orderId)
      .single();
      
    if (fetchErr) throw fetchErr;

    const updatePayload: any = { payment_status: paymentStatus };
    
    if (paymentStatus === 'paid') {
      updatePayload.advance_paid = currentInvoice.grand_total;
      updatePayload.due_amount = 0;
    } else if (paymentStatus === 'pending') {
      // Keep advance_paid as is, recalculate due_amount
      updatePayload.due_amount = Math.max(0, currentInvoice.grand_total - (currentInvoice.advance_paid || 0));
    }

    const { data: updated, error } = await admin
      .from('invoices')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        invoiceNumber: updated.invoice_number,
        paymentStatus: updated.payment_status,
        grandTotal: updated.grand_total,
        advancePaid: updated.advance_paid,
        dueAmount: updated.due_amount,
      },
    });
  } catch (error: unknown) {
    console.error('Orders PUT error:', error);
    const mapped = toOrderPublicError(error);
    return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: firstZodIssueMessage(parsed.error),
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const invoice = await updateInvoice(orderId, parsed.data);

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: unknown) {
    console.error('Orders PUT error:', error);
    const mapped = toOrderPublicError(error);
    return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const orderId = url.searchParams.get('id');
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: invoice, error: fe } = await admin
      .from('invoices')
      .select('id, customer_id, invoice_number, grand_total, is_draft, items:invoice_items(fabric_variant_id, meters)')
      .eq('id', orderId)
      .single();
    if (fe) throw fe;

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const items = (invoice as { items?: { fabric_variant_id: string; meters: number }[] }).items ?? [];

    if (!invoice.is_draft) {
      for (const item of items) {
        const { data: variant } = await admin
          .from('fabric_variants')
          .select('stock_meters')
          .eq('id', item.fabric_variant_id)
          .single();
        const prev = variant?.stock_meters ?? 0;
        const newStock = prev + item.meters;
        await admin
          .from('fabric_variants')
          .update({ stock_meters: newStock })
          .eq('id', item.fabric_variant_id);

        await admin.from('inventory_transactions').insert({
          fabric_variant_id: item.fabric_variant_id,
          type: 'returned',
          meters_changed: item.meters,
          previous_stock: prev,
          new_stock: newStock,
          reference_type: 'invoice_deletion',
          reference_id: invoice.id,
          notes: `Order ${invoice.invoice_number} deleted`,
        });
      }

      if (invoice.customer_id) {
        const { data: cust } = await admin
          .from('customers')
          .select('lifetime_value, total_orders')
          .eq('id', invoice.customer_id)
          .single();
        if (cust) {
          await admin
            .from('customers')
            .update({
              total_orders: Math.max(0, (cust.total_orders ?? 0) - 1),
              lifetime_value: Math.max(0, (cust.lifetime_value ?? 0) - invoice.grand_total),
            })
            .eq('id', invoice.customer_id);
        }
      }
    }

    const { error: de } = await admin.from('invoices').delete().eq('id', orderId);
    if (de) throw de;

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    console.error('Orders DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
