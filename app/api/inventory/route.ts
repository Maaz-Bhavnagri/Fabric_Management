import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

const fabricSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  color: z.string().min(1),
  purchasePricePerMeter: z.number().nonnegative(),
  sellingPricePerMeter: z.number().nonnegative(),
  stockMeters: z.number().nonnegative().default(0),
  minStockLevel: z.number().nonnegative().default(10),
  imageUrl: z.string().optional(),
  googleDriveFileId: z.string().optional(),
});

function normalizeCategory(cat: string): string {
  if (!cat) return '';
  return cat
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function mapVariantToRow(v: {
  id: string;
  variant_name: string;
  color: string;
  purchase_price_per_meter: number;
  selling_price_per_meter: number;
  stock_meters: number;
  low_stock_threshold: number;
  image_url: string | null;
  google_drive_file_id: string | null;
  barcode: string | null;
  created_at: string;
  design?: {
    design_name: string;
    category: string;
    sku_prefix: string;
  } | null;
}) {
  const d = v.design;
  return {
    id: v.id,
    designName: d?.design_name || '',
    variantName: v.variant_name,
    category: d?.category || '',
    skuPrefix: d?.sku_prefix || '',
    barcode: v.barcode,
    color: v.color,
    purchasePricePerMeter: v.purchase_price_per_meter,
    sellingPricePerMeter: v.selling_price_per_meter,
    stockMeters: v.stock_meters,
    lowStockThreshold: v.low_stock_threshold,
    imageUrl: v.google_drive_file_id ? `/api/drive-image?id=${v.google_drive_file_id}` : v.image_url,
    googleDriveFileId: v.google_drive_file_id,
    createdAt: new Date(v.created_at).toISOString(),
  };
}

function escapeIlike(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const url = new URL(request.url);
    const variantId = url.searchParams.get('id');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const lowStockOnly = url.searchParams.get('lowStock') === 'true';

    if (variantId) {
      const { data: variant, error } = await admin
        .from('fabric_variants')
        .select('*, design:fabric_designs(*)')
        .eq('id', variantId)
        .maybeSingle();
      if (error) throw error;
      if (!variant) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mapVariantToRow(variant as Parameters<typeof mapVariantToRow>[0]) });
    }

    let designIdsForCategory: string[] | null = null;
    if (category) {
      const { data: drows, error: de } = await admin
        .from('fabric_designs')
        .select('id')
        .ilike('category', category.trim());
      if (de) throw de;
      designIdsForCategory = (drows ?? []).map((r) => r.id);
      if (designIdsForCategory.length === 0) {
        return NextResponse.json({ success: true, data: [], total: 0, limit, offset });
      }
    }

    let searchDesignIds: string[] = [];
    if (search) {
      const pat = `%${escapeIlike(search.trim())}%`;
      const { data: sdesigns, error: se } = await admin
        .from('fabric_designs')
        .select('id')
        .or(`design_name.ilike.${pat},category.ilike.${pat}`);
      if (se) throw se;
      searchDesignIds = (sdesigns ?? []).map((r) => r.id);
    }

    const buildBase = () => {
      let q = admin
        .from('fabric_variants')
        .select('*, design:fabric_designs(*)', { count: 'exact' })
        .eq('is_active', true);
      if (lowStockOnly) q = q.lt('stock_meters', 10);
      if (designIdsForCategory) q = q.in('fabric_design_id', designIdsForCategory);
      if (search) {
        const pat = `%${escapeIlike(search.trim())}%`;
        const orParts = [`color.ilike.${pat}`, `variant_name.ilike.${pat}`];
        if (searchDesignIds.length) orParts.push(`fabric_design_id.in.(${searchDesignIds.join(',')})`);
        q = q.or(orParts.join(','));
      }
      return q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    };

    const { data: variants, error, count } = await buildBase();
    if (error) throw error;

    const rows = (variants ?? []).map((v) => mapVariantToRow(v as Parameters<typeof mapVariantToRow>[0]));

    return NextResponse.json({ success: true, data: rows, total: count ?? 0, limit, offset });
  } catch (error: unknown) {
    console.error('Inventory GET error:', error);
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
    const parsed = fabricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      category,
      color,
      purchasePricePerMeter,
      sellingPricePerMeter,
      stockMeters,
      minStockLevel,
      imageUrl,
      googleDriveFileId,
    } = parsed.data;

    const normalizedCategory = normalizeCategory(category);
    const safeBasePrefix = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
    const skuPrefix = `${safeBasePrefix}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const admin = createAdminClient();

    const { data: existingDesign } = await admin
      .from('fabric_designs')
      .select('id')
      .eq('sku_prefix', skuPrefix)
      .maybeSingle();

    let designId: string;
    if (existingDesign) {
      designId = existingDesign.id;
    } else {
      const { data: design, error: de } = await admin
        .from('fabric_designs')
        .insert({
          design_name: name,
          sku_prefix: skuPrefix,
          category: normalizedCategory,
        })
        .select('id')
        .single();
      if (de) throw de;
      designId = design.id;
    }

    const { data: variant, error: ve } = await admin
      .from('fabric_variants')
      .insert({
        fabric_design_id: designId,
        variant_name: 'Base',
        color,
        purchase_price_per_meter: purchasePricePerMeter,
        selling_price_per_meter: sellingPricePerMeter,
        stock_meters: stockMeters,
        low_stock_threshold: minStockLevel,
        image_url: imageUrl ?? null,
        google_drive_file_id: googleDriveFileId ?? null,
      })
      .select('*, design:fabric_designs(*)')
      .single();
    if (ve) throw ve;

    if (stockMeters > 0) {
      const { error: te } = await admin.from('inventory_transactions').insert({
        fabric_variant_id: variant.id,
        type: 'purchase',
        meters_changed: stockMeters,
        previous_stock: 0,
        new_stock: stockMeters,
        notes: 'Initial entry',
      });
      if (te) throw te;
    }

    return NextResponse.json(
      { success: true, data: mapVariantToRow(variant as Parameters<typeof mapVariantToRow>[0]) },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Inventory POST error:', error);
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
    const variantId = url.searchParams.get('id');
    if (!variantId) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, color, sellingPricePerMeter, purchasePricePerMeter, stockMeters, isActive, imageUrl, lowStockThreshold } =
      body;

    const admin = createAdminClient();

    const { data: v, error: ve } = await admin
      .from('fabric_variants')
      .select('id, fabric_design_id')
      .eq('id', variantId)
      .single();
    if (ve) throw ve;
    if (!v) throw new Error('Not found');

    if (name || category) {
      const patch: Record<string, unknown> = {};
      if (name) patch.design_name = name;
      if (category) patch.category = normalizeCategory(category);
      const { error: ue } = await admin.from('fabric_designs').update(patch).eq('id', v.fabric_design_id);
      if (ue) throw ue;
    }

    const vpatch: Record<string, unknown> = {};
    if (color) vpatch.color = color;
    if (sellingPricePerMeter !== undefined) vpatch.selling_price_per_meter = sellingPricePerMeter;
    if (purchasePricePerMeter !== undefined) vpatch.purchase_price_per_meter = purchasePricePerMeter;
    if (stockMeters !== undefined) vpatch.stock_meters = stockMeters;
    if (isActive !== undefined) vpatch.is_active = isActive;
    if (imageUrl !== undefined) vpatch.image_url = imageUrl;
    if (lowStockThreshold !== undefined) vpatch.low_stock_threshold = lowStockThreshold;

    const { data: updated, error: upe } = await admin
      .from('fabric_variants')
      .update(vpatch)
      .eq('id', variantId)
      .select('*, design:fabric_designs(*)')
      .single();
    if (upe) throw upe;

    return NextResponse.json({
      success: true,
      data: mapVariantToRow(updated as Parameters<typeof mapVariantToRow>[0]),
    });
  } catch (error: unknown) {
    console.error('Inventory PUT error:', error);
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
    const variantId = url.searchParams.get('id');
    if (!variantId) {
      return NextResponse.json({ success: false, error: 'Variant ID required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('fabric_variants').update({ is_active: false }).eq('id', variantId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Inventory DELETE error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
