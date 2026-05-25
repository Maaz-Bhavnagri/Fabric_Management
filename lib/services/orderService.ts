import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PG_UNIQUE_VIOLATION } from '@/lib/database/errors'
import { mapInvoiceDbToApiDetail, type InvoiceDbShape } from '@/lib/database/invoice-mapper'
import crypto from 'crypto'

// ==========================================
// SALES & BILLING
// ==========================================

export interface CounterBillingCustomerInput {
  fullName: string
  phone: string
  email?: string
  address?: string
  city?: string
}

export interface CounterBillingItemInput {
  fabricVariantId?: string
  meters: number
  ratePerMeter: number
  stitchingPrice?: number
  discount?: number
  isNewVariant?: boolean
  newProductDetails?: {
    designName: string
    category: string
    color: string
    purchasePricePerMeter: number
    initialStockMeters: number
  }
  stitchTypeNames?: string[]
  stitchAssignments?: {
    stitchTypeName: string
    customerPrice: number
    tailors?: {
      tailorId: string
      quantity: number
      tailorPrice: number
    }[]
  }[]
}

export interface CounterBillingMeasurementInput {
  chest?: number
  waist?: number
  shoulder?: number
  sleeve?: number
  neck?: number
  hip?: number
  inseam?: number
  length?: number
  customNotes?: string
  photoUrl?: string
  photoFileId?: string
  photoName?: string
}

export interface CounterBillingCreateInput {
  invoiceNumber: string
  customerId?: string
  customer?: CounterBillingCustomerInput
  measurement?: CounterBillingMeasurementInput
  walkIn?: boolean
  discount?: number
  tax?: number
  advancePaid?: number
  paymentMethod: string
  paymentStatus: string
  notes?: string
  isDraft?: boolean
  meta?: Record<string, unknown>
  items: CounterBillingItemInput[]
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

type ProcessedLine = {
  fabricVariantId: string
  meters: number
  ratePerMeter: number
  stitchingPrice: number
  lineTotal: number
}

async function processOrderItems(
  admin: SupabaseClient,
  items: CounterBillingItemInput[],
): Promise<ProcessedLine[]> {
  const processedItems: ProcessedLine[] = []
  for (const item of items) {
    if (item.isNewVariant && item.newProductDetails) {
      const details = item.newProductDetails
      let designId: string
      const { data: existingDesign } = await admin
        .from('fabric_designs')
        .select('id')
        .eq('design_name', details.designName)
        .maybeSingle()

      if (existingDesign) {
        designId = existingDesign.id
      } else {
        const prefix =
          details.designName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000)
        const { data: createdDesign, error: de } = await admin
          .from('fabric_designs')
          .insert({
            id: crypto.randomUUID(),
            design_name: details.designName,
            category: details.category,
            sku_prefix: prefix,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        if (de) throw de
        designId = createdDesign.id
      }

      const { data: variant, error: ve } = await admin
        .from('fabric_variants')
        .insert({
          id: crypto.randomUUID(),
          fabric_design_id: designId,
          variant_name: details.color,
          color: details.color,
          purchase_price_per_meter: details.purchasePricePerMeter,
          selling_price_per_meter: item.ratePerMeter,
          stock_meters: details.initialStockMeters,
          low_stock_threshold: 10,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (ve) throw ve

      const { error: te } = await admin.from('inventory_transactions').insert({
        id: crypto.randomUUID(),
        fabric_variant_id: variant.id,
        type: 'purchase',
        meters_changed: details.initialStockMeters,
        previous_stock: 0,
        new_stock: details.initialStockMeters,
        notes: 'Initial stock added from Add Order flow',
      })
      if (te) throw te

      processedItems.push({
        fabricVariantId: variant.id,
        meters: item.meters,
        ratePerMeter: item.ratePerMeter,
        stitchingPrice: item.stitchingPrice ?? 0,
        lineTotal: item.meters * item.ratePerMeter + (item.stitchingPrice ?? 0),
      })
    } else {
      if (!item.fabricVariantId) throw new Error('fabricVariantId is missing for an existing product')
      processedItems.push({
        fabricVariantId: item.fabricVariantId,
        meters: item.meters,
        ratePerMeter: item.ratePerMeter,
        stitchingPrice: item.stitchingPrice ?? 0,
        lineTotal: item.meters * item.ratePerMeter + (item.stitchingPrice ?? 0),
      })
    }
  }
  return processedItems
}

async function saveStitchTypes(
  admin: SupabaseClient,
  originalItems: CounterBillingItemInput[],
  createdInvoiceItems: { id: string }[],
  invoiceId: string
) {
  for (let i = 0; i < originalItems.length; i++) {
    const item = originalItems[i]
    const names = item.stitchTypeNames
    const assignments = item.stitchAssignments
    
    if ((!names || names.length === 0) && (!assignments || assignments.length === 0)) continue
    
    const invoiceItemId = createdInvoiceItems[i]?.id
    if (!invoiceItemId) continue

    // Track processed stitch types to avoid duplicate junction entries
    const processedStitchTypes = new Set<string>()

    const linkStitchType = async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return null

      let { data: st } = await admin.from('stitch_types').select('id').eq('name', trimmed).maybeSingle()
      if (!st) {
        const ins = await admin.from('stitch_types').insert({ name: trimmed }).select('id').single()
        if (ins.error) throw ins.error
        st = ins.data
      }

      if (!processedStitchTypes.has(st!.id)) {
        const { error: linkErr } = await admin.from('invoice_item_stitch_types').insert({
          invoice_item_id: invoiceItemId,
          stitch_type_id: st!.id,
        })
        if (linkErr && linkErr.code !== PG_UNIQUE_VIOLATION) throw linkErr
        processedStitchTypes.add(st!.id)
      }
      return st!.id
    }

    if (names && names.length > 0) {
      for (const name of names) {
        await linkStitchType(name)
      }
    }

    if (assignments && assignments.length > 0) {
      for (const assign of assignments) {
        const stId = await linkStitchType(assign.stitchTypeName)
        if (!stId) continue

        if (assign.tailors && assign.tailors.length > 0) {
          for (const t of assign.tailors) {
            const qty = t.quantity || 1
            const custTotal = assign.customerPrice * qty
            const tailorTotal = t.tailorPrice * qty
            const profit = custTotal - tailorTotal

            const { error: entryErr } = await admin.from('order_stitch_entries').insert({
              id: crypto.randomUUID(),
              invoice_id: invoiceId,
              stitch_type_id: stId,
              tailor_id: t.tailorId,
              quantity: qty,
              customer_price_per_item: assign.customerPrice,
              tailor_price_per_item: t.tailorPrice,
              total_customer_amount: custTotal,
              total_tailor_amount: tailorTotal,
              total_profit: profit
            })
            if (entryErr) throw entryErr
          }
        }
      }
    }
  }
}

export async function fetchInvoiceDetail(admin: SupabaseClient, invoiceId: string) {
  const { data: inv, error } = await admin
    .from('invoices')
    .select(
      `
      *,
      customer:customers(
        *,
        measurements:customer_measurements(*)
      ),
      items:invoice_items(
        *,
        fabric_variant:fabric_variants(
          *,
          design:fabric_designs(*)
        ),
        invoice_item_stitch_types(
          id,
          workflow_status,
          stitch_type:stitch_types(id, name)
        )
      ),
      order_stitch_entries(
        *,
        tailor:tailors(full_name)
      )
    `,
    )
    .eq('id', invoiceId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return mapInvoiceDbToApiDetail(inv as InvoiceDbShape)
}

export async function createInvoice(data: CounterBillingCreateInput) {
  const admin = createAdminClient()
  const discount = data.discount ?? 0
  const tax = data.tax ?? 0
  const advancePaid = data.advancePaid ?? 0
  const isDraft = data.isDraft ?? false
  const totalFabricAmount = data.items.reduce((sum, item) => sum + item.meters * item.ratePerMeter, 0)
  const totalStitchingAmount = data.items.reduce((sum, item) => sum + (item.stitchingPrice ?? 0), 0)
  const subtotal = totalFabricAmount + totalStitchingAmount
  const grandTotal = Math.max(0, subtotal - discount + tax)
  const dueAmount = Math.max(0, grandTotal - advancePaid)

  let customerId = data.customerId

  if (!customerId && data.customer && !data.walkIn) {
    const phone = normalizePhone(data.customer.phone)
    const { data: existingCustomer } = await admin.from('customers').select('id').eq('phone', phone).maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const { data: createdCustomer, error: ce } = await admin
        .from('customers')
        .insert({
          id: crypto.randomUUID(),
          full_name: data.customer.fullName,
          phone,
          email: data.customer.email ?? null,
          address: data.customer.address ?? null,
          city: data.customer.city ?? null,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (ce) throw ce
      customerId = createdCustomer.id
    }
  }

  const itemsCreate = await processOrderItems(admin, data.items)

  if (!isDraft) {
    for (const line of itemsCreate) {
      const { data: variant, error: ve } = await admin
        .from('fabric_variants')
        .select('stock_meters')
        .eq('id', line.fabricVariantId)
        .single()
      if (ve) throw ve
      if (!variant || variant.stock_meters < line.meters) {
        throw new Error(
          `Insufficient stock for variant ID ${line.fabricVariantId}. Available: ${variant?.stock_meters ?? 0}, Required: ${line.meters}`,
        )
      }
    }
  }

  const invoiceInsert = {
    id: crypto.randomUUID(),
    invoice_number: data.invoiceNumber,
    customer_id: customerId ?? null,
    subtotal,
    discount,
    tax,
    grand_total: grandTotal,
    advance_paid: advancePaid,
    due_amount: dueAmount,
    total_fabric_amount: totalFabricAmount,
    total_stitching_amount: totalStitchingAmount,
    is_draft: isDraft,
    meta: (data.meta ?? null) as Record<string, unknown> | null,
    payment_method: data.paymentMethod,
    payment_status: data.paymentStatus,
    notes: data.notes ?? null,
    expected_delivery_date: data.expectedDeliveryDate || null,
    priority: data.priority || 'Normal',
  }

  const { data: invoiceRow, error: invErr } = await admin
    .from('invoices')
    .insert(invoiceInsert)
    .select('id')
    .single()
  if (invErr) throw invErr

  const invoiceId = invoiceRow.id

  const itemPayloads = itemsCreate.map((pi) => ({
    id: crypto.randomUUID(),
    invoice_id: invoiceId,
    fabric_variant_id: pi.fabricVariantId,
    meters: pi.meters,
    rate_per_meter: pi.ratePerMeter,
    stitching_price: pi.stitchingPrice,
    line_total: pi.lineTotal,
  }))

  const { data: insertedItems, error: itemsErr } = await admin
    .from('invoice_items')
    .insert(itemPayloads)
    .select('id')
  if (itemsErr) {
    await admin.from('invoices').delete().eq('id', invoiceId)
    throw itemsErr
  }

  try {
    await saveStitchTypes(admin, data.items, insertedItems ?? [], invoiceId)
  } catch (e) {
    await admin.from('invoices').delete().eq('id', invoiceId)
    throw e
  }

  const itemsList = insertedItems ?? []
  for (let idx = 0; idx < itemsList.length; idx++) {
    const invItem = itemsList[idx]
    const line = itemsCreate[idx]
    if (!isDraft && invItem && line) {
      const { data: variant, error: ve } = await admin
        .from('fabric_variants')
        .select('stock_meters')
        .eq('id', line.fabricVariantId)
        .single()
      if (ve) throw ve
      if (!variant) throw new Error('Variant missing during stock update')

      const newStock = variant.stock_meters - line.meters
      const { error: ue } = await admin
        .from('fabric_variants')
        .update({ stock_meters: newStock })
        .eq('id', line.fabricVariantId)
      if (ue) throw ue

      const { error: te } = await admin.from('inventory_transactions').insert({
        id: crypto.randomUUID(),
        fabric_variant_id: line.fabricVariantId,
        type: 'sale',
        meters_changed: -line.meters,
        previous_stock: variant.stock_meters,
        new_stock: newStock,
        reference_type: 'invoice',
        reference_id: invoiceId,
        notes: `Sold via invoice ${data.invoiceNumber}`,
      })
      if (te) throw te
    }
  }

  if (customerId && !isDraft) {
    const { data: cust } = await admin
      .from('customers')
      .select('lifetime_value, total_orders')
      .eq('id', customerId)
      .single()
    if (cust) {
      const { error: ue } = await admin
        .from('customers')
        .update({
          lifetime_value: (cust.lifetime_value ?? 0) + grandTotal,
          total_orders: (cust.total_orders ?? 0) + 1,
        })
        .eq('id', customerId)
      if (ue) throw ue
    }
  }

  if (customerId && data.measurement) {
    const m = data.measurement
    const hasMeasurementData = Object.values(m).some((v) => v !== undefined && v !== '' && v !== null)
    if (hasMeasurementData) {
      const { error: me } = await admin.from('customer_measurements').insert({
        id: crypto.randomUUID(),
        customer_id: customerId,
        chest: typeof m.chest === 'number' ? m.chest : null,
        waist: typeof m.waist === 'number' ? m.waist : null,
        shoulder: typeof m.shoulder === 'number' ? m.shoulder : null,
        sleeve: typeof m.sleeve === 'number' ? m.sleeve : null,
        neck: typeof m.neck === 'number' ? m.neck : null,
        hip: typeof m.hip === 'number' ? m.hip : null,
        inseam: typeof m.inseam === 'number' ? m.inseam : null,
        length: typeof m.length === 'number' ? m.length : null,
        custom_notes: m.customNotes ?? null,
        photo_url: m.photoUrl ?? null,
        photo_file_id: m.photoFileId ?? null,
        photo_name: m.photoName ?? null,
      })
      if (me) throw me
    }
  }

  return fetchInvoiceDetail(admin, invoiceId)
}

export async function updateInvoice(orderId: string, data: CounterBillingCreateInput) {
  const admin = createAdminClient()

  const { data: oldInvoice, error: fe } = await admin
    .from('invoices')
    .select(
      `
      *,
      items:invoice_items(id, fabric_variant_id, meters)
    `,
    )
    .eq('id', orderId)
    .single()
  if (fe) throw fe
  if (!oldInvoice) throw new Error('Invoice not found')

  const oldItems = (oldInvoice as { items?: { fabric_variant_id: string; meters: number }[] }).items ?? []

  if (!oldInvoice.is_draft && oldItems.length > 0) {
    const oldVariantIds = [...new Set(oldItems.map((item) => item.fabric_variant_id))]
    const { data: oldVariants } = await admin
      .from('fabric_variants')
      .select('id, stock_meters')
      .in('id', oldVariantIds)
    const oldVariantMap = new Map((oldVariants ?? []).map((v) => [v.id, v]))

    for (const item of oldItems) {
      const variant = oldVariantMap.get(item.fabric_variant_id)
      if (!variant) throw new Error('Selected product is not available in live inventory.')

      const newStock = variant.stock_meters + item.meters
      const { error: ue } = await admin
        .from('fabric_variants')
        .update({ stock_meters: newStock })
        .eq('id', item.fabric_variant_id)
      if (ue) throw ue

      const { error: te } = await admin.from('inventory_transactions').insert({
        id: crypto.randomUUID(),
        fabric_variant_id: item.fabric_variant_id,
        type: 'adjustment',
        meters_changed: item.meters,
        previous_stock: variant.stock_meters,
        new_stock: newStock,
        reference_type: 'invoice',
        reference_id: orderId,
        notes: `Rolled back for invoice edit ${oldInvoice.invoice_number}`,
      })
      if (te) throw te
    }

    if (oldInvoice.customer_id) {
      const { data: cust } = await admin
        .from('customers')
        .select('lifetime_value, total_orders')
        .eq('id', oldInvoice.customer_id)
        .single()
      if (cust) {
        const { error: ue } = await admin
          .from('customers')
          .update({
            lifetime_value: Math.max(0, (cust.lifetime_value ?? 0) - oldInvoice.grand_total),
            total_orders: Math.max(0, (cust.total_orders ?? 0) - 1),
          })
          .eq('id', oldInvoice.customer_id)
        if (ue) throw ue
      }
    }
  }

  const { error: delErr } = await admin.from('invoice_items').delete().eq('invoice_id', orderId)
  if (delErr) throw delErr

  // Delete old order_stitch_entries so we can re-insert cleanly
  const { error: delStitchErr } = await admin.from('order_stitch_entries').delete().eq('invoice_id', orderId)
  if (delStitchErr) throw delStitchErr

  const discount = data.discount ?? 0
  const tax = data.tax ?? 0
  const advancePaid = data.advancePaid ?? 0
  const isDraft = data.isDraft ?? false
  const totalFabricAmountUpdate = data.items.reduce((sum, item) => sum + item.meters * item.ratePerMeter, 0)
  const totalStitchingAmountUpdate = data.items.reduce((sum, item) => sum + (item.stitchingPrice ?? 0), 0)
  const subtotal = totalFabricAmountUpdate + totalStitchingAmountUpdate
  const grandTotal = Math.max(0, subtotal - discount + tax)
  const dueAmount = Math.max(0, grandTotal - advancePaid)

  let customerId = data.customerId
  if (!customerId && data.customer && !data.walkIn) {
    const phone = normalizePhone(data.customer.phone)
    const { data: existingCustomer } = await admin.from('customers').select('id').eq('phone', phone).maybeSingle()
    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const { data: createdCustomer, error: ce } = await admin
        .from('customers')
        .insert({
          id: crypto.randomUUID(),
          full_name: data.customer.fullName,
          phone,
          email: data.customer.email ?? null,
          address: data.customer.address ?? null,
          city: data.customer.city ?? null,
        })
        .select('id')
        .single()
      if (ce) throw ce
      customerId = createdCustomer.id
    }
  } else if (data.walkIn) {
    customerId = undefined
  }

  const itemsCreate = await processOrderItems(admin, data.items)

  if (!isDraft) {
    for (const line of itemsCreate) {
      const { data: variant, error: ve } = await admin
        .from('fabric_variants')
        .select('stock_meters')
        .eq('id', line.fabricVariantId)
        .single()
      if (ve) throw ve
      if (!variant || variant.stock_meters < line.meters) {
        throw new Error(
          `Insufficient stock. Available: ${variant?.stock_meters ?? 0}m, required: ${line.meters}m.`,
        )
      }
    }
  }

  const { error: upErr } = await admin
    .from('invoices')
    .update({
      invoice_number: data.invoiceNumber,
      customer_id: customerId ?? null,
      subtotal,
      discount,
      tax,
      grand_total: grandTotal,
      advance_paid: advancePaid,
      due_amount: dueAmount,
      total_fabric_amount: totalFabricAmountUpdate,
      total_stitching_amount: totalStitchingAmountUpdate,
      is_draft: isDraft,
      meta: (data.meta ?? null) as Record<string, unknown> | null,
      payment_method: data.paymentMethod,
      payment_status: data.paymentStatus,
      notes: data.notes ?? null,
      expected_delivery_date: data.expectedDeliveryDate || null,
      priority: data.priority || 'Normal',
    })
    .eq('id', orderId)
  if (upErr) throw upErr

  const itemPayloads = itemsCreate.map((pi) => ({
    id: crypto.randomUUID(),
    invoice_id: orderId,
    fabric_variant_id: pi.fabricVariantId,
    meters: pi.meters,
    rate_per_meter: pi.ratePerMeter,
    stitching_price: pi.stitchingPrice,
    line_total: pi.lineTotal,
  }))

  const { data: insertedItems, error: insErr } = await admin
    .from('invoice_items')
    .insert(itemPayloads)
    .select('id')
  if (insErr) throw insErr

  await saveStitchTypes(admin, data.items, insertedItems ?? [], orderId)

  if (!isDraft && (insertedItems?.length ?? 0) > 0) {
    const newVariantIds = [...new Set(itemsCreate.map((item) => item.fabricVariantId))]
    const { data: newVariants } = await admin
      .from('fabric_variants')
      .select('id, stock_meters')
      .in('id', newVariantIds)
    const newVariantMap = new Map((newVariants ?? []).map((v) => [v.id, v]))

    for (let idx = 0; idx < (insertedItems ?? []).length; idx++) {
      const line = itemsCreate[idx]
      const variant = newVariantMap.get(line.fabricVariantId)
      if (!variant) throw new Error('Selected product is not available in live inventory.')
      if (variant.stock_meters < line.meters) {
        throw new Error(`Insufficient stock. Available: ${variant.stock_meters}m, required: ${line.meters}m.`)
      }
      const newStock = variant.stock_meters - line.meters
      const { error: ue } = await admin
        .from('fabric_variants')
        .update({ stock_meters: newStock })
        .eq('id', line.fabricVariantId)
      if (ue) throw ue

      const { error: te } = await admin.from('inventory_transactions').insert({
        id: crypto.randomUUID(),
        fabric_variant_id: line.fabricVariantId,
        type: 'sale',
        meters_changed: -line.meters,
        previous_stock: variant.stock_meters,
        new_stock: newStock,
        reference_type: 'invoice',
        reference_id: orderId,
        notes: `Sold via invoice edit ${data.invoiceNumber}`,
      })
      if (te) throw te
      newVariantMap.set(line.fabricVariantId, { id: variant.id, stock_meters: newStock })
    }
  }

  if (customerId && !isDraft) {
    const { data: cust } = await admin
      .from('customers')
      .select('lifetime_value, total_orders')
      .eq('id', customerId)
      .single()
    if (cust) {
      const { error: ue } = await admin
        .from('customers')
        .update({
          lifetime_value: (cust.lifetime_value ?? 0) + grandTotal,
          total_orders: (cust.total_orders ?? 0) + 1,
        })
        .eq('id', customerId)
      if (ue) throw ue
    }
  }

  return fetchInvoiceDetail(admin, orderId)
}

// ==========================================
// TAILORING (STITCH ORDERS)
// ==========================================

export async function createStitchOrder(data: {
  orderNumber: string
  customerId: string
  garmentType: string
  invoiceId?: string
  dueDate: Date
  priority?: string
  totalPrice: number
  advancePayment?: number
  designNotes?: string
  measurements?: {
    chest?: number
    waist?: number
    shoulder?: number
    sleeve?: number
    neck?: number
    hip?: number
    length?: number
    customNotes?: string
  }
}) {
  const admin = createAdminClient()
  const advance = data.advancePayment || 0
  const balance = data.totalPrice - advance

  const { data: row, error } = await admin
    .from('stitch_orders')
    .insert({
      id: crypto.randomUUID(),
      order_number: data.orderNumber,
      customer_id: data.customerId,
      garment_type: data.garmentType,
      invoice_id: data.invoiceId ?? null,
      due_date: data.dueDate.toISOString(),
      priority: data.priority || 'normal',
      total_price: data.totalPrice,
      advance_payment: advance,
      balance_payment: balance,
      design_notes: data.designNotes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  if (data.measurements) {
    const m = data.measurements
    const { error: me } = await admin.from('measurements').insert({
      id: crypto.randomUUID(),
      stitch_order_id: row.id,
      chest: m.chest ?? null,
      waist: m.waist ?? null,
      shoulder: m.shoulder ?? null,
      sleeve: m.sleeve ?? null,
      neck: m.neck ?? null,
      hip: m.hip ?? null,
      length: m.length ?? null,
      custom_notes: m.customNotes ?? null,
    })
    if (me) throw me
  }

  const { data: full, error: fe } = await admin
    .from('stitch_orders')
    .select('*, measurements(*)')
    .eq('id', row.id)
    .single()
  if (fe) throw fe

  const measArr = full.measurements as
    | {
        id: string
        chest: number | null
        waist: number | null
        shoulder: number | null
        sleeve: number | null
        neck: number | null
        hip: number | null
        length: number | null
        custom_notes: string | null
      }[]
    | null
  const meas = Array.isArray(measArr) ? measArr[0] : null

  return {
    id: full.id,
    orderNumber: full.order_number,
    customerId: full.customer_id,
    garmentType: full.garment_type,
    invoiceId: full.invoice_id,
    dueDate: full.due_date,
    priority: full.priority,
    status: full.status,
    totalPrice: full.total_price,
    advancePayment: full.advance_payment,
    balancePayment: full.balance_payment,
    designNotes: full.design_notes,
    measurements: meas
      ? {
          id: meas.id,
          chest: meas.chest,
          waist: meas.waist,
          shoulder: meas.shoulder,
          sleeve: meas.sleeve,
          neck: meas.neck,
          hip: meas.hip,
          length: meas.length,
          customNotes: meas.custom_notes,
        }
      : null,
  }
}
