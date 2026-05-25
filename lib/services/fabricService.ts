import Papa from 'papaparse'
import { createAdminClient } from '@/lib/supabase/admin'

// ==========================================
// DESIGNS & VARIANTS CRUD
// ==========================================

export async function createFabricDesign(data: {
  designName: string
  skuPrefix: string
  category: string
  material?: string
  widthInches?: number
}) {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('fabric_designs')
    .insert({
      design_name: data.designName,
      sku_prefix: data.skuPrefix,
      category: data.category,
      material: data.material ?? null,
      width_inches: data.widthInches ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return row
}

export async function createFabricVariant(data: {
  fabricDesignId: string
  variantName: string
  color: string
  purchasePricePerMeter: number
  sellingPricePerMeter: number
  stockMeters: number
}) {
  const admin = createAdminClient()
  const { data: variant, error: ve } = await admin
    .from('fabric_variants')
    .insert({
      fabric_design_id: data.fabricDesignId,
      variant_name: data.variantName,
      color: data.color,
      purchase_price_per_meter: data.purchasePricePerMeter,
      selling_price_per_meter: data.sellingPricePerMeter,
      stock_meters: data.stockMeters,
    })
    .select()
    .single()
  if (ve) throw ve

  if (data.stockMeters > 0) {
    const { error: te } = await admin.from('inventory_transactions').insert({
      fabric_variant_id: variant.id,
      type: 'purchase',
      meters_changed: data.stockMeters,
      previous_stock: 0,
      new_stock: data.stockMeters,
      notes: 'Initial stock addition',
    })
    if (te) throw te
  }

  return variant
}

export async function getLowStockVariants() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fabric_variants')
    .select('*, design:fabric_designs(*)')
    .eq('is_active', true)
    .lt('stock_meters', 10)
  if (error) throw error
  return data ?? []
}

// ==========================================
// BULK IMPORT
// ==========================================

export async function bulkImportProducts(csvString: string) {
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error('CSV Parsing Error: ' + parsed.errors[0].message)
  }

  const rows = parsed.data as Array<Record<string, string>>
  const admin = createAdminClient()
  let importedVariantsCount = 0

  const designCache = new Map<string, string>()

  for (const row of rows) {
    if (!row.sku_prefix || !row.design_name || !row.color) continue

    let designId = designCache.get(row.sku_prefix)

    if (!designId) {
      const { data: existing } = await admin
        .from('fabric_designs')
        .select('id')
        .eq('sku_prefix', row.sku_prefix)
        .maybeSingle()

      if (existing) {
        designId = existing.id
      } else {
        const { data: created, error: de } = await admin
          .from('fabric_designs')
          .insert({
            design_name: row.design_name,
            sku_prefix: row.sku_prefix,
            category: row.category || 'Uncategorized',
            material: row.material || null,
          })
          .select('id')
          .single()
        if (de) throw de
        designId = created.id
      }
      if (!designId) continue
      designCache.set(row.sku_prefix, designId)
    }

    const { data: existingVariant } = await admin
      .from('fabric_variants')
      .select('id')
      .eq('fabric_design_id', designId)
      .eq('color', row.color)
      .maybeSingle()

    if (!existingVariant) {
      const stock = parseFloat(row.initial_stock) || 0
      const { data: variant, error: ve } = await admin
        .from('fabric_variants')
        .insert({
          fabric_design_id: designId,
          variant_name: row.color,
          color: row.color,
          purchase_price_per_meter: parseFloat(row.purchase_price) || 0,
          selling_price_per_meter: parseFloat(row.selling_price) || 0,
          stock_meters: stock,
        })
        .select('id')
        .single()
      if (ve) throw ve

      if (stock > 0) {
        const { error: te } = await admin.from('inventory_transactions').insert({
          fabric_variant_id: variant.id,
          type: 'purchase',
          meters_changed: stock,
          previous_stock: 0,
          new_stock: stock,
          notes: 'Bulk import initial stock',
        })
        if (te) throw te
      }
      importedVariantsCount++
    }
  }

  return importedVariantsCount
}
