import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';

const workflowSchema = z.object({
  stitchTypeIds: z.array(z.union([z.string(), z.number()])).min(1),
  status: z.enum(['fabric_cutting', 'stitching', 'buttons', 'steam_press', 'complete', 'delivered']),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = workflowSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stitchTypeIds, status } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('invoice_item_stitch_types')
      .update({ 
        workflow_status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', stitchTypeIds)
      .select('id, workflow_status');

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Workflow PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}
