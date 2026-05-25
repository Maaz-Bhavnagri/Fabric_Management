import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';

export async function POST() {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    let created = 0;

    const { count, error: ce } = await admin.from('fabric_designs').select('*', { count: 'exact', head: true });
    if (ce) throw ce;
    if ((count ?? 0) > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${count} designs. Skipping init.`,
      });
    }

    const designs = [
      {
        designName: 'Cotton Floral Premium',
        skuPrefix: 'CT-FLO-PRM',
        category: 'Cotton',
        material: 'Pure Cotton',
        variants: [
          {
            variantName: 'Blue',
            color: 'Blue',
            barcode: 'CT-FLO-PRM-BLUE',
            purchasePricePerMeter: 120,
            sellingPricePerMeter: 250,
            stockMeters: 50,
          },
          {
            variantName: 'Pink',
            color: 'Pink',
            barcode: 'CT-FLO-PRM-PINK',
            purchasePricePerMeter: 120,
            sellingPricePerMeter: 250,
            stockMeters: 30,
          },
        ],
      },
      {
        designName: 'Linen White Classic',
        skuPrefix: 'LIN-WHT-CLS',
        category: 'Linen',
        material: 'Linen',
        variants: [
          {
            variantName: 'Pure White',
            color: 'White',
            barcode: 'LIN-WHT-CLS-WHITE',
            purchasePricePerMeter: 200,
            sellingPricePerMeter: 450,
            stockMeters: 100,
          },
        ],
      },
    ];

    for (const g of designs) {
      const { data: design, error: de } = await admin
        .from('fabric_designs')
        .insert({
          design_name: g.designName,
          sku_prefix: g.skuPrefix,
          category: g.category,
          material: g.material,
        })
        .select('id')
        .single();
      if (de) throw de;

      for (const v of g.variants) {
        const { error: ve } = await admin.from('fabric_variants').insert({
          fabric_design_id: design.id,
          variant_name: v.variantName,
          color: v.color,
          barcode: v.barcode,
          purchase_price_per_meter: v.purchasePricePerMeter,
          selling_price_per_meter: v.sellingPricePerMeter,
          stock_meters: v.stockMeters,
        });
        if (ve) throw ve;
        created++;
      }
    }

    return NextResponse.json({ success: true, message: `Initialized ${created} fabric variants.` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Init error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
