export interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  inventoryValue: number
  monthlyRevenue: number
  totalFabricRevenue?: number
  totalStitchingRevenue?: number
  totalTailorExpenses?: number
  totalStitchProfit?: number
  // Expanded Analytics
  topSellingFabrics?: Array<{ name: string, meters: number, revenue: number, orders: number }>
  categoryRevenue?: Array<{ name: string, value: number, percentage: number }>
  revenueVsProfit?: Array<{ period: string, revenue: number, cost: number, profit: number }>
  paymentStatus?: Array<{ status: string, count: number, amount: number }>
  customerRetention?: { new: number, repeat: number, rate: number }
  colorPopularity?: Array<{ color: string, meters: number, revenue: number }>
  seasonalTrends?: Array<{ month: string, revenue: number, orders: number }>
}

export interface InventoryRow {
  id: string
  designName: string
  variantName: string
  category: string
  skuPrefix?: string
  barcode?: string | null
  color: string
  purchasePricePerMeter: number
  sellingPricePerMeter: number
  stockMeters: number
  lowStockThreshold: number
  imageUrl?: string | null
  googleDriveFileId?: string | null
  createdAt: string
}

export interface CustomerRow {
  id: string
  fullName: string
  email?: string | null
  phone: string
  city?: string | null
  lifetimeValue: number
  totalOrders: number
  createdAt: string
  measurement?: {
    chest?: number | null
    waist?: number | null
    shoulder?: number | null
    sleeve?: number | null
    neck?: number | null
    hip?: number | null
    inseam?: number | null
    length?: number | null
    customNotes?: string | null
    photoUrl?: string | null
    photoFileId?: string | null
  } | null
}

export interface SupplierRow {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  gstin?: string | null
  paymentTerms?: string | null
  createdAt: string
}

export interface InvoiceRow {
  id: string
  invoiceNumber: string
  createdAt: string
  grandTotal: number
  dueAmount?: number
  advancePaid?: number
  isDraft?: boolean
  paymentStatus: string
  paymentMethod?: string
  itemsCount?: number
  customer?: { fullName: string; phone: string } | null
}

export interface InvoiceDetail extends InvoiceRow {
  paymentMethod?: 'cash' | 'upi' | 'card' | 'mixed' | string
  notes?: string | null
  discount?: number
  tax?: number
  subtotal?: number
  totalFabricAmount?: number
  totalStitchingAmount?: number
  items?: Array<{
    id: string
    fabricVariantId: string
    meters: number
    ratePerMeter: number
    stitchingPrice: number
    lineTotal: number
    discount?: number
    stitchAssignments?: {
      stitchTypeName: string
      customerPrice: number
      tailors: {
        tailorId: string
        tailorName: string
        quantity: number
        tailorPrice: number
      }[]
    }[]
    fabricVariant?: {
      id: string
      variantName: string
      color: string
      design?: { designName: string }
    }
  }>
  customer?: {
    fullName: string
    phone: string
    email?: string
    address?: string
    city?: string
  }
  measurement?: {
    chest?: number | null
    waist?: number | null
    shoulder?: number | null
    sleeve?: number | null
    neck?: number | null
    hip?: number | null
    inseam?: number | null
    length?: number | null
    customNotes?: string | null
    photoUrl?: string | null
    photoFileId?: string | null
    photoName?: string | null
  }
}

export interface CounterCustomerInput {
  fullName: string
  phone: string
  email?: string
  address?: string
  city?: string
}

export interface CustomerMeasurementInput {
  chest?: number | ''
  waist?: number | ''
  shoulder?: number | ''
  sleeve?: number | ''
  neck?: number | ''
  hip?: number | ''
  inseam?: number | ''
  length?: number | ''
  customNotes?: string
  // Photo held as File in browser until submit
  photoFile?: File | null
  // Resolved after upload
  photoUrl?: string
  photoFileId?: string
  photoName?: string
}

export interface CounterOrderItemInput {
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
}

export interface CounterOrderMeta {
  salespersonName?: string
  deliveryRequired?: boolean
  priorityCustomer?: boolean
  customTag?: string
}

export interface CounterOrderRequest {
  invoiceNumber: string
  customerId?: string
  customer?: CounterCustomerInput
  measurement?: Omit<CustomerMeasurementInput, 'photoFile'>
  walkIn?: boolean
  discount?: number
  tax?: number
  advancePaid?: number
  paymentMethod: 'cash' | 'upi' | 'card' | 'mixed'
  paymentStatus: 'paid' | 'pending'
  isDraft?: boolean
  notes?: string
  meta?: CounterOrderMeta
  items: CounterOrderItemInput[]
}

export interface CustomerQuickInfo extends CustomerRow {
  address?: string | null
  lastOrderDate?: string
  outstandingDue?: number
  measurement?: {
    chest?: number | null
    waist?: number | null
    shoulder?: number | null
    sleeve?: number | null
    neck?: number | null
    hip?: number | null
    inseam?: number | null
    length?: number | null
    customNotes?: string | null
    photoUrl?: string | null
    photoFileId?: string | null
    photoName?: string | null
  } | null
}
