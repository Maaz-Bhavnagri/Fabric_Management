import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from('fabric_designs')
      .select('category')
      .neq('category', '')
      .order('category', { ascending: true });
    if (error) throw error;

    const result = [...new Set((rows ?? []).map((r) => r.category).filter(Boolean))];

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
