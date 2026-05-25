import type { Json } from '@/lib/database/types'

/** Map nested Supabase invoice row (snake_case) to API shape expected by the UI (camelCase). */
export function mapInvoiceDbToApiDetail(inv: InvoiceDbShape): Record<string, unknown> {
  const customer = inv.customer
    ? {
        fullName: inv.customer.full_name,
        phone: inv.customer.phone,
        email: inv.customer.email ?? undefined,
        address: inv.customer.address ?? undefined,
        city: inv.customer.city ?? undefined,
        measurements: inv.customer.measurements ?? [],
      }
    : null

  const items = (inv.items ?? []).map((row) => {
    const fv = row.fabric_variant
    const design = fv?.design
    
    const stitchTypes = (row.invoice_item_stitch_types ?? []).map(st => st.stitch_type)
    
    // Group order_stitch_entries by stitch_type_id for this invoice
    const stitchAssignments = stitchTypes.map(st => {
      const entriesForType = (inv.order_stitch_entries ?? []).filter(e => e.stitch_type_id === st.id)
      const stLink = (row.invoice_item_stitch_types ?? []).find(l => l.stitch_type.id === st.id)
      
      return {
        id: stLink?.id,
        workflowStatus: stLink?.workflow_status ?? 'fabric_cutting',
        stitchTypeName: st.name,
        customerPrice: entriesForType.length > 0 ? entriesForType[0].customer_price_per_item : 0,
        tailors: entriesForType.map(e => ({
          tailorId: e.tailor_id,
          tailorName: e.tailor?.full_name ?? 'Unknown',
          quantity: e.quantity,
          tailorPrice: e.tailor_price_per_item
        }))
      }
    })

    return {
      id: row.id,
      fabricVariantId: row.fabric_variant_id,
      meters: row.meters,
      ratePerMeter: row.rate_per_meter,
      stitchingPrice: row.stitching_price,
      lineTotal: row.line_total,
      stitchAssignments,
      fabricVariant: fv
        ? {
            id: fv.id,
            variantName: fv.variant_name,
            color: fv.color,
            imageUrl: fv.image_url,
            design: design
              ? {
                  designName: design.design_name,
                  defaultImageUrl: design.default_image_url,
                }
              : undefined,
          }
        : undefined,
    }
  })

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    customerId: inv.customer_id,
    subtotal: inv.subtotal,
    discount: inv.discount,
    tax: inv.tax,
    grandTotal: inv.grand_total,
    advancePaid: inv.advance_paid ?? 0,
    dueAmount: inv.due_amount ?? 0,
    totalFabricAmount: inv.total_fabric_amount ?? 0,
    totalStitchingAmount: inv.total_stitching_amount ?? 0,
    isDraft: inv.is_draft ?? false,
    meta: inv.meta as Record<string, unknown> | null,
    paymentMethod: inv.payment_method,
    paymentStatus: inv.payment_status,
    notes: inv.notes,
    expectedDeliveryDate: inv.expected_delivery_date,
    priority: inv.priority ?? 'Normal',
    createdAt: inv.created_at,
    customer,
    items,
  }
}

type DesignNested = {
  design_name: string
  default_image_url?: string | null
}

type FabricVariantNested = {
  id: string
  variant_name: string
  color: string
  image_url?: string | null
  design?: DesignNested | null
}

type InvoiceItemNested = {
  id: string
  invoice_id: string
  fabric_variant_id: string
  meters: number
  rate_per_meter: number
  stitching_price: number
  line_total: number
  fabric_variant?: FabricVariantNested | null
  invoice_item_stitch_types?: {
    id: string
    workflow_status: string
    stitch_type: { id: string; name: string }
  }[] | null
}

type CustomerNested = {
  full_name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  measurements?: any[] | null
}

type OrderStitchEntryNested = {
  stitch_type_id: string
  tailor_id: string
  quantity: number
  customer_price_per_item: number
  tailor_price_per_item: number
  tailor?: { full_name: string } | null
}

export type InvoiceDbShape = {
  id: string
  invoice_number: string
  customer_id: string | null
  subtotal: number
  discount: number
  tax: number
  grand_total: number
  advance_paid?: number
  due_amount?: number
  total_fabric_amount?: number
  total_stitching_amount?: number
  is_draft?: boolean
  meta: Json | null
  payment_method: string
  payment_status: string
  notes: string | null
  expected_delivery_date?: string | null
  priority?: 'Low' | 'Normal' | 'Urgent' | string | null
  created_at: string
  customer?: CustomerNested | null
  items?: InvoiceItemNested[] | null
  order_stitch_entries?: OrderStitchEntryNested[] | null
}
