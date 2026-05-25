import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';
import { isPostgrestTableMissing, STITCH_TYPES_SETUP_HINT } from '@/lib/database/errors';

function responseIfStitchTypesSetupMissing(error: unknown): NextResponse | null {
  if (
    isPostgrestTableMissing(error, 'stitch_types') ||
    isPostgrestTableMissing(error, 'invoice_item_stitch_types')
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Stitch types are not set up in the database. ${STITCH_TYPES_SETUP_HINT}`,
      },
      { status: 503 },
    );
  }
  return null;
}

function mapStitchType(row: { id: string; name: string; is_popular: boolean; created_at: string }) {
  return {
    id: row.id,
    name: row.name,
    isPopular: row.is_popular,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const { data: types, error } = await admin
      .from('stitch_types')
      .select('*')
      .order('is_popular', { ascending: false })
      .order('name', { ascending: true });
    if (error) {
      const missing = responseIfStitchTypesSetupMissing(error);
      if (missing) return missing;
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (types ?? []).map((t) => mapStitchType(t as Parameters<typeof mapStitchType>[0])),
    });
  } catch (error) {
    const missing = responseIfStitchTypesSetupMissing(error);
    if (missing) return missing;
    console.error('StitchTypes GET error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (Array.isArray((body as { stitchTypes?: unknown }).stitchTypes)) {
      const results = [];
      for (const item of (body as { stitchTypes: { name?: string; isPopular?: boolean }[] }).stitchTypes) {
        const name = (item.name || '').trim();
        if (!name) continue;

        const { data: existing } = await admin.from('stitch_types').select('*').eq('name', name).maybeSingle();
        if (existing) {
          results.push(mapStitchType(existing as Parameters<typeof mapStitchType>[0]));
        } else {
          const { data: created, error } = await admin
            .from('stitch_types')
            .insert({ name, is_popular: item.isPopular || false })
            .select()
            .single();
          if (error) {
            const missing = responseIfStitchTypesSetupMissing(error);
            if (missing) return missing;
            throw error;
          }
          results.push(mapStitchType(created as Parameters<typeof mapStitchType>[0]));
        }
      }
      return NextResponse.json({ success: true, data: results }, { status: 201 });
    }

    const name = (((body as { name?: string }).name) || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Stitch type name is required' }, { status: 400 });
    }

    const { data: existing } = await admin.from('stitch_types').select('*').eq('name', name).maybeSingle();
    if (existing) {
      return NextResponse.json({
        success: true,
        data: mapStitchType(existing as Parameters<typeof mapStitchType>[0]),
      });
    }

    const { data: created, error } = await admin
      .from('stitch_types')
      .insert({
        name,
        is_popular: (body as { isPopular?: boolean }).isPopular || false,
      })
      .select()
      .single();
    if (error) {
      const missing = responseIfStitchTypesSetupMissing(error);
      if (missing) return missing;
      throw error;
    }

    return NextResponse.json(
      { success: true, data: mapStitchType(created as Parameters<typeof mapStitchType>[0]) },
      { status: 201 },
    );
  } catch (error) {
    const missing = responseIfStitchTypesSetupMissing(error);
    if (missing) return missing;
    console.error('StitchTypes POST error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    const { id, name, isPopular } = body as { id?: string; name?: string; isPopular?: boolean };

    if (!id || !name?.trim()) {
      return NextResponse.json({ success: false, error: 'ID and name are required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const patch: Record<string, unknown> = { name: name.trim() };
    if (isPopular !== undefined) patch.is_popular = isPopular;

    const { data: updated, error } = await admin.from('stitch_types').update(patch).eq('id', id).select().single();
    if (error) {
      const missing = responseIfStitchTypesSetupMissing(error);
      if (missing) return missing;
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: mapStitchType(updated as Parameters<typeof mapStitchType>[0]),
    });
  } catch (error) {
    const missing = responseIfStitchTypesSetupMissing(error);
    if (missing) return missing;
    console.error('StitchTypes PUT error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 503 },
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
      return NextResponse.json({ success: false, error: 'Stitch type ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { count, error: cntErr } = await admin
      .from('invoice_item_stitch_types')
      .select('*', { count: 'exact', head: true })
      .eq('stitch_type_id', id);
    if (cntErr) {
      const missing = responseIfStitchTypesSetupMissing(cntErr);
      if (missing) return missing;
      throw cntErr;
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete stitch type - it's used in ${count} order(s)` },
        { status: 409 },
      );
    }

    const { error } = await admin.from('stitch_types').delete().eq('id', id);
    if (error) {
      const missing = responseIfStitchTypesSetupMissing(error);
      if (missing) return missing;
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Stitch type deleted successfully' });
  } catch (error) {
    const missing = responseIfStitchTypesSetupMissing(error);
    if (missing) return missing;
    console.error('StitchTypes DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 503 },
    );
  }
}
