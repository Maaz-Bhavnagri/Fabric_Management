/**
 * Row shapes aligned with existing PostgreSQL tables (Supabase/PostgREST JSON keys).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface FabricDesignRow {
  id: string
  design_name: string
  sku_prefix: string
  category: string
  brand: string | null
  supplier: string | null
  material: string | null
  width_inches: number | null
  gsm: number | null
  notes: string | null
  default_image_url: string | null
  created_at: string
  updated_at: string
}

export interface FabricVariantRow {
  id: string
  fabric_design_id: string
  variant_name: string
  color: string
  shade_code: string | null
  purchase_price_per_meter: number
  selling_price_per_meter: number
  stock_meters: number
  reserved_meters: number
  low_stock_threshold: number
  image_url: string | null
  google_drive_file_id: string | null
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerRowDb {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  preferred_language: string | null
  notes: string | null
  lifetime_value: number
  total_orders: number
  created_at: string
  updated_at: string
}

export interface InvoiceRowDb {
  id: string
  invoice_number: string
  customer_id: string | null
  subtotal: number
  discount: number
  tax: number
  grand_total: number
  advance_paid: number
  due_amount: number
  total_fabric_amount: number
  total_stitching_amount: number
  is_draft: boolean
  meta: Json | null
  payment_method: string
  payment_status: string
  notes: string | null
  created_at: string
}

export interface InvoiceItemRowDb {
  id: string
  invoice_id: string
  fabric_variant_id: string
  meters: number
  rate_per_meter: number
  stitching_price: number
  line_total: number
}

export interface StitchTypeRowDb {
  id: string
  name: string
  is_popular: boolean
  created_at: string
}

export interface PairedDeviceRowDb {
  id: string
  admin_user_id: string
  device_name: string
  device_type: string
  browser_info: string | null
  device_token_hash: string | null
  pairing_token: string | null
  pairing_token_expiry: string | null
  last_seen: string | null
  is_active: boolean
  created_at: string
}

export interface CustomerMeasurementRowDb {
  id: string
  customer_id: string
  chest: number | null
  waist: number | null
  shoulder: number | null
  sleeve: number | null
  neck: number | null
  hip: number | null
  inseam: number | null
  length: number | null
  custom_notes: string | null
  photo_url: string | null
  photo_file_id: string | null
  photo_name: string | null
  created_at: string
  updated_at: string
}

export interface InventoryTransactionInsert {
  fabric_variant_id: string
  type: string
  meters_changed: number
  previous_stock: number
  new_stock: number
  reference_type?: string | null
  reference_id?: string | null
  notes?: string | null
}
