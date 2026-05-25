import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

const tailorSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  specialization: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search') || '';

    if (id) {
      const { data, error } = await admin
        .from('tailors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    let q = admin.from('tailors').select('*').order('full_name', { ascending: true });
    
    if (search) {
      q = q.ilike('full_name', `%${search}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error('Tailors GET error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = tailorSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const admin = createAdminClient();
    
    const { data, error } = await admin
      .from('tailors')
      .insert({
        id: crypto.randomUUID(),
        full_name: d.fullName,
        phone: d.phone,
        address: d.address ?? null,
        specialization: d.specialization ?? null,
        notes: d.notes ?? null,
        is_active: d.isActive,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: unknown) {
    console.error('Tailors POST error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Tailor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = tailorSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const admin = createAdminClient();
    
    const { data, error } = await admin
      .from('tailors')
      .update({
        full_name: d.fullName,
        phone: d.phone,
        address: d.address ?? null,
        specialization: d.specialization ?? null,
        notes: d.notes ?? null,
        is_active: d.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Tailors PUT error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Tailor ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    // Soft delete by setting is_active = false
    const { error } = await admin
      .from('tailors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: unknown) {
    console.error('Tailors DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}
