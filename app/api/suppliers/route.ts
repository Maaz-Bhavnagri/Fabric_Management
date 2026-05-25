import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import { isMissingRow } from '@/lib/database/errors';
import crypto from 'crypto';

const supplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  gstin: z.string().optional(),
  paymentTerms: z.string().optional(),
});

function mapSupplier(s: Record<string, unknown>) {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    city: s.city,
    gstin: s.gstin,
    paymentTerms: s.payment_terms,
    address: s.address,
    createdAt: s.created_at ? new Date(s.created_at as string).toISOString() : undefined,
    updatedAt: s.updated_at ? new Date(s.updated_at as string).toISOString() : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const url = new URL(request.url);
    const supplierId = url.searchParams.get('id');

    if (supplierId) {
      const { data: supplier, error } = await admin.from('suppliers').select('*').eq('id', supplierId).single();
      if (error) throw error;
      if (!supplier) {
        return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mapSupplier(supplier as Record<string, unknown>) });
    }

    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let q = admin
      .from('suppliers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const pat = `%${search.trim()}%`;
      q = q.or(`name.ilike.${pat},email.ilike.${pat},phone.ilike.${pat}`);
    }

    const { data: suppliers, error, count } = await q;
    if (error) throw error;

    const rows = (suppliers ?? []).map((s) => mapSupplier(s as Record<string, unknown>));

    return NextResponse.json({ success: true, data: rows, total: count ?? 0, limit, offset });
  } catch (error: unknown) {
    console.error('Suppliers GET error:', error);
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
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const admin = createAdminClient();
    const { data: supplier, error } = await admin
      .from('suppliers')
      .insert({
        id: crypto.randomUUID(),
        name: d.name,
        email: d.email ?? null,
        phone: d.phone ?? null,
        address: d.address ?? null,
        city: d.city ?? null,
        gstin: d.gstin ?? null,
        payment_terms: d.paymentTerms ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data: mapSupplier(supplier as Record<string, unknown>) }, { status: 201 });
  } catch (error: unknown) {
    console.error('Suppliers POST error:', error);
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
    const supplierId = url.searchParams.get('id');
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = supplierSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const d = parsed.data;
    const patch: Record<string, unknown> = {};
    if (d.name !== undefined) patch.name = d.name;
    if (d.email !== undefined) patch.email = d.email;
    if (d.phone !== undefined) patch.phone = d.phone;
    if (d.address !== undefined) patch.address = d.address;
    if (d.city !== undefined) patch.city = d.city;
    if (d.gstin !== undefined) patch.gstin = d.gstin;
    if (d.paymentTerms !== undefined) patch.payment_terms = d.paymentTerms;

    const admin = createAdminClient();
    const { data: supplier, error } = await admin
      .from('suppliers')
      .update(patch)
      .eq('id', supplierId)
      .select()
      .single();
    if (error) throw error;
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mapSupplier(supplier as Record<string, unknown>) });
  } catch (error: unknown) {
    console.error('Suppliers PUT error:', error);
    if (isMissingRow(error)) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }
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
    const supplierId = url.searchParams.get('id');
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: deleted, error } = await admin.from('suppliers').delete().eq('id', supplierId).select('id');
    if (error) throw error;
    if (!deleted?.length) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Suppliers DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
