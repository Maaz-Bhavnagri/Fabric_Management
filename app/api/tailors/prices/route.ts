import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import crypto from 'crypto';

const priceEntrySchema = z.object({
  stitchTypeId: z.string().min(1, 'Stitch type ID is required'),
  price: z.number().nonnegative('Price cannot be negative'),
});

const updatePricesSchema = z.object({
  tailorId: z.string().min(1, 'Tailor ID is required'),
  prices: z.array(priceEntrySchema),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const tailorId = url.searchParams.get('tailorId');
    const stitchTypeId = url.searchParams.get('stitchTypeId');

    const admin = createAdminClient();

    let q = admin
      .from('tailor_stitch_prices')
      .select(`
        id, tailor_id, stitch_type_id, price,
        stitch_types ( name )
      `);

    if (tailorId) q = q.eq('tailor_id', tailorId);
    if (stitchTypeId) q = q.eq('stitch_type_id', stitchTypeId);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error('Tailor Prices GET error:', error);
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

    const body = await request.json();
    const parsed = updatePricesSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tailorId, prices } = parsed.data;
    const admin = createAdminClient();

    // Verify tailor exists
    const { data: tailor, error: tailorError } = await admin
      .from('tailors')
      .select('id')
      .eq('id', tailorId)
      .single();

    if (tailorError || !tailor) {
      return NextResponse.json({ success: false, error: 'Tailor not found' }, { status: 404 });
    }

    // Since we're doing a batch update, it's easiest to delete existing prices for this tailor
    // and re-insert the provided ones (or do an upsert). 
    // We will do an upsert on ON CONFLICT (tailor_id, stitch_type_id).
    
    const payloads = prices.map(p => ({
      id: crypto.randomUUID(), // Provide ID for inserts
      tailor_id: tailorId,
      stitch_type_id: p.stitchTypeId,
      price: p.price
    }));

    // Perform an upsert
    // Note: Supabase upsert requires specifying the onConflict columns if there's a unique constraint
    const { data, error } = await admin
      .from('tailor_stitch_prices')
      .upsert(payloads, { onConflict: 'tailor_id,stitch_type_id' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Tailor Prices PUT error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 }
    );
  }
}
