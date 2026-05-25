import * as mock from '@/lib/mockData'

export function fallbackDashboardMetrics() {
  const m = mock.calculateMetrics()
  return {
    totalRevenue: m.totalRevenue,
    totalOrders: m.totalOrders,
    totalCustomers: m.totalCustomers,
    inventoryValue: m.inventoryValue,
    monthlyRevenue: m.monthlyRevenue,
  }
}

export function fallbackOrders() {
  return mock.mockOrders.map((o) => ({
    id: o.id,
    invoiceNumber: o.id,
    createdAt: new Date(o.date).toISOString(),
    grandTotal: o.total,
    paymentStatus: o.status === 'delivered' ? 'paid' : 'pending',
    paymentMethod: 'cash',
    itemsCount: o.items?.length || 1,
    customer: o.customerName ? { fullName: o.customerName, phone: '' } : null,
  }))
}

export function fallbackCustomers() {
  return mock.mockCustomers.map((c) => ({
    id: c.id,
    fullName: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    lifetimeValue: c.totalPurchases,
    totalOrders: c.orderCount,
    createdAt: new Date(c.lastPurchase).toISOString(),
  }))
}

export function fallbackSuppliers() {
  return mock.mockSuppliers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    city: s.city,
    gstin: undefined,
    paymentTerms: undefined,
    createdAt: new Date().toISOString(),
  }))
}

export function fallbackInventory() {
  const supplierById = new Map(mock.mockSuppliers.map((s) => [s.id, s.name]))
  return mock.mockFabrics.map((f) => ({
    id: f.id,
    designName: f.name,
    variantName: f.color,
    category: f.type,
    color: f.color,
    sellingPricePerMeter: f.price,
    stockMeters: f.stock,
    lowStockThreshold: 10,
    createdAt: new Date().toISOString(),
    supplierName: supplierById.get(f.supplier),
  }))
}

