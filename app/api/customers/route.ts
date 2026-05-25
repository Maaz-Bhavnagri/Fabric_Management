import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import { isUniqueViolation } from '@/lib/database/errors';
import crypto from 'crypto';

const customerSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  preferredLanguage: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerMeasurementApi = {
  chest: number | null;
  waist: number | null;
  shoulder: number | null;
  sleeve: number | null;
  neck: number | null;
  hip: number | null;
  inseam: number | null;
  length: number | null;
  custom_notes: string | null;
  photo_url: string | null;
  photo_file_id: string | null;
  photo_name: string | null;
};

function mapMeasurement(m: CustomerMeasurementApi) {
  return {
    chest: m.chest,
    waist: m.waist,
    shoulder: m.shoulder,
    sleeve: m.sleeve,
    neck: m.neck,
    hip: m.hip,
    inseam: m.inseam,
    length: m.length,
    customNotes: m.custom_notes,
    photoUrl: m.photo_url
      ? m.photo_file_id
        ? `/api/drive-image?id=${m.photo_file_id}`
        : m.photo_url
      : undefined,
    photoFileId: m.photo_file_id,
    photoName: m.photo_name,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const url = new URL(request.url);
    const customerId = url.searchParams.get('id');
    const phone = url.searchParams.get('phone');
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (customerId) {
      const { data: customer, error } = await admin
        .from('customers')
        .select(
          `
          *,
          invoices:invoices(*),
          stitch_orders:stitch_orders(*)
        `,
        )
        .eq('id', customerId)
        .single();
      if (error) throw error;
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
      }

      const inv = customer.invoices as { created_at: string }[] | null;
      const so = customer.stitch_orders as { created_at: string }[] | null;
      const invoicesSorted = [...(inv ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const stitchSorted = [...(so ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return NextResponse.json({
        success: true,
        data: {
          ...customer,
          fullName: customer.full_name,
          lifetimeValue: customer.lifetime_value,
          totalOrders: customer.total_orders,
          preferredLanguage: customer.preferred_language,
          createdAt: customer.created_at,
          updatedAt: customer.updated_at,
          invoices: invoicesSorted.slice(0, 5),
          stitchOrders: stitchSorted.slice(0, 5),
        },
      });
    }

    if (phone) {
      const { data: customer, error } = await admin
        .from('customers')
        .select(
          `
          *,
          measurements:customer_measurements(*)
        `,
        )
        .eq('phone', phone)
        .maybeSingle();
      if (error) throw error;
      if (!customer) {
        return NextResponse.json({ success: true, data: null });
      }

      const measurements = (customer.measurements ?? []) as {
        created_at: string;
        chest: number | null;
        waist: number | null;
        shoulder: number | null;
        sleeve: number | null;
        neck: number | null;
        hip: number | null;
        inseam: number | null;
        length: number | null;
        custom_notes: string | null;
        photo_url: string | null;
        photo_file_id: string | null;
        photo_name: string | null;
      }[];
      const latestMeasurement = measurements.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      const [{ data: lastInvRows }, { data: dueRows }] = await Promise.all([
        admin
          .from('invoices')
          .select('created_at')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1),
        admin.from('invoices').select('due_amount').eq('customer_id', customer.id),
      ]);
      const lastInvoice = lastInvRows?.[0];

      const outstandingDue = (dueRows ?? []).reduce((s, r) => s + (r.due_amount ?? 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          lifetimeValue: customer.lifetime_value,
          totalOrders: customer.total_orders,
          createdAt: new Date(customer.created_at).toISOString(),
          lastOrderDate: lastInvoice?.created_at
            ? new Date(lastInvoice.created_at).toISOString()
            : undefined,
          outstandingDue,
          measurement: latestMeasurement ? mapMeasurement(latestMeasurement) : null,
        },
      });
    }

    let q = admin
      .from('customers')
      .select(
        `
        *,
        measurements:customer_measurements(*)
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const pat = `%${search.trim()}%`;
      q = q.or(`full_name.ilike.${pat},phone.ilike.${pat},email.ilike.${pat}`);
    }

    const { data: customers, error, count } = await q;
    if (error) throw error;

    const rows = (customers ?? []).map((c) => {
      const measurements = (c.measurements ?? []) as (CustomerMeasurementApi & { created_at: string })[];
      const latest = measurements.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
      return {
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        lifetimeValue: c.lifetime_value,
        totalOrders: c.total_orders,
        createdAt: new Date(c.created_at).toISOString(),
        measurement: latest ? mapMeasurement(latest) : null,
      };
    });

    return NextResponse.json({ success: true, data: rows, total: count ?? 0, limit, offset });
  } catch (error: unknown) {
    console.error('Customers GET error:', error);
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
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const d = parsed.data;
    const { data: customer, error } = await admin
      .from('customers')
      .insert({
        id: crypto.randomUUID(),
        full_name: d.fullName,
        phone: d.phone,
        email: d.email ?? null,
        address: d.address ?? null,
        city: d.city ?? null,
        preferred_language: d.preferredLanguage ?? null,
        notes: d.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        fullName: customer.full_name,
        lifetimeValue: customer.lifetime_value,
        totalOrders: customer.total_orders,
        preferredLanguage: customer.preferred_language,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Customers POST error:', error);
    if (isUniqueViolation(error)) {
      return NextResponse.json({ success: false, error: 'Phone number already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const customerId = url.searchParams.get('id');
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.fullName !== undefined) patch.full_name = d.fullName;
    if (d.phone !== undefined) patch.phone = d.phone;
    if (d.email !== undefined) patch.email = d.email;
    if (d.address !== undefined) patch.address = d.address;
    if (d.city !== undefined) patch.city = d.city;
    if (d.preferredLanguage !== undefined) patch.preferred_language = d.preferredLanguage;
    if (d.notes !== undefined) patch.notes = d.notes;

    const admin = createAdminClient();
    const { data: customer, error } = await admin
      .from('customers')
      .update(patch)
      .eq('id', customerId)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        fullName: customer.full_name,
        lifetimeValue: customer.lifetime_value,
        totalOrders: customer.total_orders,
        preferredLanguage: customer.preferred_language,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      },
    });
  } catch (error: unknown) {
    console.error('Customers PUT error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const customerId = url.searchParams.get('id');
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('customers').delete().eq('id', customerId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Customers DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
