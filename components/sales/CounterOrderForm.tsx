'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronDown,
  ChevronUp,
  UserCircle,
  ShoppingCart,
  IndianRupee,
  NotebookTabs,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Save,
  Printer,
  FileEdit,
  History,
  Phone,
  Users,
  UserPlus,
  BadgeCheck,
  Plus,
  Trash2,
  Loader2,
  Package,
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import CustomerMeasurementsSection from './CustomerMeasurementsSection'
import StitchTypesSelector from './StitchTypesSelector'
import { inventoryApi } from '@/lib/api-client'
import type {
  InvoiceRow,
  InvoiceDetail,
  CustomerQuickInfo,
  InventoryRow,
  CounterOrderRequest,
  CounterCustomerInput,
  CustomerMeasurementInput,
} from '@/lib/app-types'

// ── Types ──────────────────────────────────────────────────
interface CounterLineItem {
  fabricVariantId: string
  searchText: string
  label: string
  availableStock: number
  originalMeters?: number
  meters: number
  ratePerMeter: number
  stitchingPrice: number
  stitchTypes: string[]
  stitchAssignments?: {
    stitchTypeName: string;
    customerPrice: number;
    tailors: {
      tailorId: string;
      tailorName: string;
      quantity: number;
      tailorPrice: number;
    }[];
  }[];
  isLocked?: boolean
  expandDetails?: boolean
  isNewVariant?: boolean
  designName?: string
  category?: string
  color?: string
  purchasePricePerMeter?: number
  initialStockMeters?: number
  imageUrl?: string | null
  // Original values from the selected product (used for smart comparison)
  _originalDesignName?: string
  _originalCategory?: string
  _originalColor?: string
  _originalPurchasePrice?: number
  _originalSellingPrice?: number
  _originalImageUrl?: string | null
}

interface TailorOption {
  id: string
  full_name: string
  prices: Record<string, number> // stitch_type_id -> price
}

interface StitchTypeOption {
  id: string
  name: string
  isPopular: boolean
}

interface CounterOrderFormProps {
  createOrder: (order: CounterOrderRequest) => Promise<unknown>
  updateOrder?: (id: string, order: CounterOrderRequest) => Promise<unknown>
  lookupCustomerByPhone: (phone: string) => Promise<CustomerQuickInfo | null>
  fetchOrderById: (id: string) => Promise<InvoiceDetail>
  drafts: InvoiceRow[]
  editingOrderId?: string | null
  onClose?: () => void
}

function toUiSaveErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : 'Unable to save.';
  const lower = raw.toLowerCase();

  if (lower.includes('insufficient stock') || lower.includes('stock is not enough')) {
    return 'Insufficient stock. Please reduce meters.';
  }
  if (lower.includes('available') && lower.includes('requested')) {
    return raw;
  }
  if (lower.includes('invoice number already exists')) {
    return 'This bill number already exists. Please use a new bill number.';
  }
  if (lower.includes('temporarily unavailable') || lower.includes("can't reach database")) {
    return 'Server/database is temporarily unavailable. Please try again in a moment.';
  }
  if (lower.includes('took too long') || lower.includes('timeout')) {
    return 'Request timed out while saving. Please click save again.';
  }
  if (lower.includes('invalid input')) {
    return 'Some required fields are invalid. Please check customer, items, and payment details.';
  }
  return raw;
}

const emptyItem = (): CounterLineItem => ({
  fabricVariantId: '',
  searchText: '',
  label: '',
  availableStock: 0,
  originalMeters: 0,
  meters: 1,
  ratePerMeter: 0,
  stitchingPrice: 0,
  stitchTypes: [],
  stitchAssignments: [],
  isLocked: false,
  expandDetails: false,
  isNewVariant: false,
  designName: '',
  category: 'Cotton',
  color: '',
  purchasePricePerMeter: 0,
  initialStockMeters: 0,
  imageUrl: null,
  _originalDesignName: undefined,
  _originalCategory: undefined,
  _originalColor: undefined,
  _originalPurchasePrice: undefined,
  _originalSellingPrice: undefined,
  _originalImageUrl: undefined,
})

/** Check if admin changed any important fields from the original selected product */
function hasProductChanged(item: CounterLineItem): boolean {
  if (!item._originalDesignName) return true // never selected from DB
  return (
    (item.designName ?? '') !== (item._originalDesignName ?? '') ||
    (item.color ?? '') !== (item._originalColor ?? '') ||
    (item.category ?? '') !== (item._originalCategory ?? '') ||
    (item.purchasePricePerMeter ?? 0) !== (item._originalPurchasePrice ?? 0) ||
    (item.ratePerMeter ?? 0) !== (item._originalSellingPrice ?? 0)
  )
}

function genInvoiceNumber() {
  const d = new Date()
  const y = String(d.getFullYear()).slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `S-${y}${m}${day}-${rand}`
}

// ── Accordion wrapper ───────────────────────────────────────
function AccordionSection({
  icon,
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode
  title: string
  badge?: string | number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-xl overflow-visible bg-white dark:bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge !== undefined && badge !== '' && (
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-muted-foreground font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
export default function CounterOrderForm({
  createOrder,
  updateOrder,
  lookupCustomerByPhone,
  fetchOrderById,
  drafts,
  editingOrderId,
  onClose,
}: CounterOrderFormProps) {
  const { t } = useLanguage()
  const { toast } = useToast()

  // ── State ──────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState(genInvoiceNumber())
  const [walkIn, setWalkIn] = useState(false)
  const [customer, setCustomer] = useState<CounterCustomerInput>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  })
  const [customerInfo, setCustomerInfo] = useState<CustomerQuickInfo | null>(null)
  const [measurement, setMeasurement] = useState<CustomerMeasurementInput>({})
  const [items, setItems] = useState<CounterLineItem[]>([emptyItem()])
  const [advancePaid, setAdvancePaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'mixed'>('cash')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [manualPaymentStatus, setManualPaymentStatus] = useState(false)
  const [notes, setNotes] = useState('')
  const [salespersonName, setSalespersonName] = useState('')
  const [tax, setTax] = useState(0)
  const [priorityCustomer, setPriorityCustomer] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [selectedDraftId, setSelectedDraftId] = useState('')
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [billDiscount, setBillDiscount] = useState(0)
  const [suggestions, setSuggestions] = useState<InventoryRow[]>([])
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null)
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [confirmation, setConfirmation] = useState<null | {
    mode: 'draft' | 'confirmed'
    invoiceNumber: string
    customerName: string
    grandTotal: number
    paid: number
    pending: number
  }>(null)
  const [availableStitchTypes, setAvailableStitchTypes] = useState<StitchTypeOption[]>([])
  const [availableTailors, setAvailableTailors] = useState<TailorOption[]>([])

  // ── Fetch stitch types & tailors on mount ──────────────────
  useEffect(() => {
    fetch('/api/stitch-types')
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableStitchTypes(d.data) })
      .catch(() => {})

    // Fetch tailors and their prices
    const loadTailors = async () => {
      try {
        const [tailorRes, pricesRes] = await Promise.all([
          fetch('/api/tailors').then(r => r.json()),
          fetch('/api/tailors/prices').then(r => r.json()) // we need an endpoint that returns all prices or we fetch per tailor. Actually, the GET without tailorId returns all prices!
        ]);

        if (tailorRes.success && tailorRes.data) {
          const tailorsMap: Record<string, TailorOption> = {}
          tailorRes.data.filter((t: any) => t.is_active).forEach((t: any) => {
            tailorsMap[t.id] = { id: t.id, full_name: t.full_name, prices: {} }
          })
          
          if (pricesRes.success && pricesRes.data) {
            pricesRes.data.forEach((p: any) => {
              if (tailorsMap[p.tailor_id]) {
                const stitchName = p.stitch_types?.name
                if (stitchName) {
                  // store price keyed by stitch name for easy lookup
                  tailorsMap[p.tailor_id].prices[stitchName.toLowerCase()] = p.price
                }
              }
            })
          }
          setAvailableTailors(Object.values(tailorsMap))
        }
      } catch (e) { console.error('Failed to load tailors', e) }
    }
    loadTailors()
  }, [])

  // ── Computed ───────────────────────────────────────────────
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.meters * i.ratePerMeter, 0), [items])
  const totalStitching = useMemo(() => items.reduce((s, i) => s + (i.stitchingPrice || 0), 0), [items])
  const lineItemSummary = useMemo(
    () =>
      items
        .filter((i) => i.fabricVariantId || i.isNewVariant || i.designName)
        .map((i) => ({
          label: i.label || i.fabricVariantId,
          meters: i.meters,
          ratePerMeter: i.ratePerMeter,
          stitchingPrice: i.stitchingPrice || 0,
          discount: 0,
          lineTotal: i.meters * i.ratePerMeter + (i.stitchingPrice || 0),
        })),
    [items]
  )
  const grandTotal = useMemo(
    () => Math.max(0, subtotal + totalStitching - billDiscount),
    [subtotal, totalStitching, billDiscount]
  )
  const dueAmount = useMemo(() => Math.max(0, grandTotal - advancePaid), [grandTotal, advancePaid])

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    if (activeSuggestionRow === null) {
      setSuggestions([])
      return
    }
    const query = (items[activeSuggestionRow]?.searchText ?? '').trim()
    if (!query) {
      setSuggestions([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await inventoryApi.getFabrics(query, 100, 0)
        if (!cancelled) setSuggestions(res.fabrics)
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [items, activeSuggestionRow])

  useEffect(() => {
    const name = customer.fullName.trim()
    if (name.length < 2) { setCustomerSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(name)}&limit=8`)
        const data = await res.json()
        setCustomerSuggestions(data.data || [])
      } catch { setCustomerSuggestions([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [customer.fullName])

  useEffect(() => {
    if (walkIn || !customer.phone.trim()) { setCustomerInfo(null); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const found = await lookupCustomerByPhone(customer.phone.trim())
        if (cancelled) return
        setCustomerInfo(found)
        if (found) {
          setCustomer((prev) => ({
            ...prev,
            fullName: found.fullName ?? prev.fullName,
            email: found.email ?? prev.email,
            address: found.address ?? prev.address,
            city: found.city ?? prev.city,
          }))
          // Auto-populate measurements if customer has them saved
          if (found.measurement) {
            setMeasurement({
              chest: found.measurement.chest ?? '',
              waist: found.measurement.waist ?? '',
              shoulder: found.measurement.shoulder ?? '',
              sleeve: found.measurement.sleeve ?? '',
              neck: found.measurement.neck ?? '',
              hip: found.measurement.hip ?? '',
              inseam: found.measurement.inseam ?? '',
              length: found.measurement.length ?? '',
              customNotes: found.measurement.customNotes ?? '',
              photoUrl: found.measurement.photoUrl ?? undefined,
              photoFileId: found.measurement.photoFileId ?? undefined,
              photoName: found.measurement.photoName ?? '',
            })
          }
        }
      } catch (err) {
        console.error('Failed to lookup customer:', err)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [walkIn, customer.phone, lookupCustomerByPhone])

  useEffect(() => {
    if (!manualPaymentStatus) setPaymentStatus(dueAmount <= 0 ? 'paid' : 'pending')
  }, [dueAmount, manualPaymentStatus])

  useEffect(() => {
    if (!editingOrderId) return
    let cancelled = false

    const loadOrderForEdit = async () => {
      setSubmitting(true)
      setEditTargetId(editingOrderId)
      try {
        const orderData = await fetchOrderById(editingOrderId)
        if (!orderData || cancelled) return
            // Populate form with order data
            setInvoiceNumber(orderData.invoiceNumber || genInvoiceNumber())
            setAdvancePaid(orderData.advancePaid ?? 0)
            setPaymentMethod((orderData.paymentMethod as 'cash' | 'upi' | 'card' | 'mixed') || 'cash')
            setBillDiscount(orderData.discount ?? 0)
            setTax(orderData.tax ?? 0)
            setNotes(orderData.notes || '')
            
            // Set customer info
            if (orderData.customer) {
              setWalkIn(false)
              setCustomer({
                fullName: orderData.customer.fullName || '',
                phone: orderData.customer.phone || '',
                email: orderData.customer.email || '',
                address: orderData.customer.address || '',
                city: orderData.customer.city || '',
              })
            } else {
              setWalkIn(true)
            }
            
            // Set measurements
            if (orderData.measurement) {
              setMeasurement({
                chest: orderData.measurement.chest ?? '',
                waist: orderData.measurement.waist ?? '',
                shoulder: orderData.measurement.shoulder ?? '',
                sleeve: orderData.measurement.sleeve ?? '',
                neck: orderData.measurement.neck ?? '',
                hip: orderData.measurement.hip ?? '',
                inseam: orderData.measurement.inseam ?? '',
                length: orderData.measurement.length ?? '',
                customNotes: orderData.measurement.customNotes ?? '',
                photoUrl: orderData.measurement.photoUrl ?? '',
                photoFileId: orderData.measurement.photoFileId ?? '',
                photoName: orderData.measurement.photoName ?? '',
              })
            }
            
            // Set items with optimized fetching
            if (orderData.items && orderData.items.length > 0) {
              const orderItems = await Promise.all(orderData.items.map(async (item) => {
                let liveStock = item.meters;
                try {
                  const variant = await inventoryApi.getFabricById(item.fabricVariantId);
                  liveStock = variant.stockMeters;
                } catch (e) {
                  console.error('Failed to fetch live stock for', item.fabricVariantId, e);
                }

                return {
                  fabricVariantId: item.fabricVariantId,
                  meters: item.meters,
                  ratePerMeter: item.ratePerMeter,
                  stitchingPrice: item.stitchingPrice || 0,
                  discount: item.discount || 0,
                  lineTotal: item.lineTotal,
                  label: `${item.fabricVariant?.design?.designName || ''} - ${item.fabricVariant?.variantName || ''} - ${item.fabricVariant?.color || ''}`,
                  availableStock: liveStock,
                  originalMeters: item.meters,
                  isLocked: true,
                  searchText: `${item.fabricVariant?.design?.designName || ''} ${item.fabricVariant?.variantName || ''}`,
                  stitchTypes: item.stitchAssignments?.map(a => a.stitchTypeName) || [],
                  stitchAssignments: item.stitchAssignments || [],
                };
              }));
              setItems(orderItems)
            }
            
      } catch (error) {
        console.error('Failed to fetch order data:', error)
      } finally {
        if (!cancelled) setSubmitting(false)
      }
    }

    void loadOrderForEdit()
    return () => {
      cancelled = true
    }
  }, [editingOrderId])

  // ── Helpers ────────────────────────────────────────────────
  const resetForNext = () => {
    setInvoiceNumber(genInvoiceNumber())
    setItems([emptyItem()])
    setAdvancePaid(0)
    setPaymentMethod('cash')
    setPaymentStatus('paid')
    setManualPaymentStatus(false)
    setNotes('')
    setSalespersonName('')
    setPriorityCustomer(false)
    setCustomTag('')
    setSelectedDraftId('')
    setEditTargetId(null)
    setBillDiscount(0)
    setWalkIn(false)
    setCustomer({ fullName: '', phone: '', email: '', address: '', city: '' })
    setCustomerInfo(null)
    setMeasurement({})
  }

  const handlePhoneBlur = async () => {
    if (walkIn || !customer.phone.trim()) return
    try {
      const found = await lookupCustomerByPhone(customer.phone.trim())
      setCustomerInfo(found)
      if (found) {
        setCustomer((prev) => ({
          ...prev,
          fullName: found.fullName ?? prev.fullName,
          email: found.email ?? prev.email,
          address: found.address ?? prev.address,
          city: found.city ?? prev.city,
        }))
        if (found.measurement) {
          setMeasurement({
            chest: found.measurement.chest ?? '',
            waist: found.measurement.waist ?? '',
            shoulder: found.measurement.shoulder ?? '',
            sleeve: found.measurement.sleeve ?? '',
            neck: found.measurement.neck ?? '',
            hip: found.measurement.hip ?? '',
            inseam: found.measurement.inseam ?? '',
            length: found.measurement.length ?? '',
            customNotes: found.measurement.customNotes ?? '',
            photoUrl: found.measurement.photoUrl ?? undefined,
            photoFileId: found.measurement.photoFileId ?? undefined,
          })
        }
      }
    } catch (err) {
      console.error('Failed to handle phone blur:', err)
    }
  }

  const validate = () => {
    if (!invoiceNumber.trim()) return 'Invoice number is required.'
    if (!walkIn && !customer.phone.trim()) return 'Customer phone is required.'
    if (items.length === 0) return 'Add at least one product.'
    const maxByVariant = new Map<string, number>()
    for (const it of items) {
      if (!it.fabricVariantId) continue
      if (maxByVariant.has(it.fabricVariantId)) continue
      const live = Math.max(0, it.availableStock || 0)
      const originalTotal = items
        .filter((x) => x.fabricVariantId === it.fabricVariantId)
        .reduce((s, x) => s + (x.originalMeters ?? 0), 0)
      maxByVariant.set(it.fabricVariantId, live + originalTotal)
    }
    const totalRequestedByVariant = new Map<string, number>()
    for (const it of items) {
      if (!it.fabricVariantId) continue
      totalRequestedByVariant.set(
        it.fabricVariantId,
        (totalRequestedByVariant.get(it.fabricVariantId) ?? 0) + it.meters
      )
    }

    for (const item of items) {
      const isEffectivelyNew = item.isNewVariant || (item._originalDesignName ? hasProductChanged(item) : !item.fabricVariantId)
      if (!item.fabricVariantId && !isEffectivelyNew) return 'Select product for each row.'
      if (!(item.meters > 0)) return 'Meters must be greater than 0.'
      if (item.ratePerMeter < 0) return 'Rate cannot be negative.'
      if (item.stitchingPrice > 0 && (!item.stitchTypes || item.stitchTypes.length === 0)) {
        return 'Select at least one stitch type when stitching amount is entered.'
      }
      
      if (!isEffectivelyNew && item.fabricVariantId) {
        const requestedTotal = totalRequestedByVariant.get(item.fabricVariantId) ?? 0
        const maxAllowed = maxByVariant.get(item.fabricVariantId) ?? item.availableStock
        
        if (requestedTotal > maxAllowed) {
          return `Only ${maxAllowed}m available.`
        }
      }
    }
    return null
  }

  const validateLiveStock = async () => {
    const requiredByVariant = new Map<string, number>()
    const originalByVariant = new Map<string, number>()
    const labelByVariant = new Map<string, string>()

    for (const item of items) {
      const isEffectivelyNew = item.isNewVariant || (item._originalDesignName ? hasProductChanged(item) : !item.fabricVariantId)
      if (!item.fabricVariantId || isEffectivelyNew) continue
      requiredByVariant.set(item.fabricVariantId, (requiredByVariant.get(item.fabricVariantId) ?? 0) + item.meters)
      originalByVariant.set(
        item.fabricVariantId,
        (originalByVariant.get(item.fabricVariantId) ?? 0) + (item.originalMeters ?? 0)
      )
      if (!labelByVariant.has(item.fabricVariantId)) {
        labelByVariant.set(item.fabricVariantId, item.label || item.fabricVariantId)
      }
    }

    if (requiredByVariant.size === 0) return

    const ids = [...requiredByVariant.keys()]
    const stocks = await Promise.all(
      ids.map(async (id) => {
        try {
          const variant = await inventoryApi.getFabricById(id)
          return { id, stock: variant.stockMeters }
        } catch {
          return { id, stock: undefined as number | undefined }
        }
      })
    )
    const stockMap = new Map(stocks.map((x) => [x.id, x.stock]))

    // Keep UI stock hints fresh.
    setItems((prev) =>
      prev.map((item) => {
        const live = stockMap.get(item.fabricVariantId)
        return live === undefined ? item : { ...item, availableStock: live }
      })
    )

    for (const id of ids) {
      const required = requiredByVariant.get(id) ?? 0
      const available = stockMap.get(id)
      const original = originalByVariant.get(id) ?? 0
      const maxAllowed = (available ?? 0) + original
      if (available !== undefined && required > maxAllowed) {
        const label = labelByVariant.get(id) ?? id
        throw new Error(`Insufficient stock for ${label}. Available: ${maxAllowed}m.`)
      }
    }
  }

  const submit = async (mode: 'new' | 'print' | 'draft') => {
    const err = validate()
    if (err) { toast({ title: 'Validation error', description: err, variant: 'destructive' }); return }
    setSubmitting(true)
    try {
      await validateLiveStock()
      let resolvedMeasurement = { ...measurement }
      if (!walkIn && measurement.photoFile) {
        try {
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1000,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.6,
          }
          const compressedBlob = await imageCompression(measurement.photoFile, options)
          const compressedFile = new File([compressedBlob], measurement.photoFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })

          const fd = new FormData()
          fd.append('file', compressedFile)
          fd.append('customerName', customer.fullName || 'Customer')
          const res = await fetch('/api/measurements/upload', { method: 'POST', body: fd })
          const json = await res.json()
          if (json.success) resolvedMeasurement = { ...resolvedMeasurement, ...json.data }
        } catch { /* non-fatal */ }
      }
      const { photoFile: _f, ...measurementData } = resolvedMeasurement
      const numericMeasurementKeys = ['chest', 'waist', 'shoulder', 'sleeve', 'neck', 'hip', 'inseam', 'length'] as const
      const sanitizedMeasurement = Object.entries(measurementData).reduce<Record<string, unknown>>((acc, [key, raw]) => {
        if (raw === undefined || raw === null || raw === '') return acc
        if ((numericMeasurementKeys as readonly string[]).includes(key)) {
          const n = typeof raw === 'number' ? raw : Number(raw)
          if (Number.isFinite(n)) acc[key] = n
          return acc
        }
        acc[key] = raw
        return acc
      }, {})
      const hasAny = Object.keys(sanitizedMeasurement).length > 0

      const payload: CounterOrderRequest = {
        invoiceNumber,
        walkIn,
        customer: walkIn ? undefined : {
          fullName: customer.fullName || 'Customer',
          phone: customer.phone.trim(),
          email: customer.email || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
        },
        items: items.map((i) => {
          const changed = i._originalDesignName ? hasProductChanged(i) : !i.fabricVariantId
          const shouldCreateNew = changed || i.isNewVariant
          return {
            fabricVariantId: shouldCreateNew ? undefined : i.fabricVariantId,
            meters: i.meters,
            ratePerMeter: i.ratePerMeter,
            stitchingPrice: i.stitchingPrice || 0,
            discount: 0,
            isNewVariant: shouldCreateNew,
            newProductDetails: shouldCreateNew ? {
              designName: i.designName || i.searchText,
              category: i.category || 'Cotton',
              color: i.color || 'Base',
              purchasePricePerMeter: i.purchasePricePerMeter || 0,
              initialStockMeters: i.initialStockMeters || 0,
            } : undefined,
            stitchTypeNames: i.stitchTypes.length > 0 ? i.stitchTypes : undefined,
            stitchAssignments: i.stitchAssignments?.length ? i.stitchAssignments : undefined,
          }
        }),
        discount: billDiscount,
        tax: 0,
        advancePaid,
        paymentMethod,
        paymentStatus,
        isDraft: mode === 'draft',
        notes,
        meta: {
          salespersonName: salespersonName || undefined,
          priorityCustomer,
          customTag: customTag || undefined,
        },
      }
      if (!walkIn && hasAny) payload.measurement = sanitizedMeasurement as CounterOrderRequest['measurement']

      const targetOrderId = editTargetId || editingOrderId
      if (targetOrderId && updateOrder) {
        await updateOrder(targetOrderId, payload)
      } else {
        await createOrder(payload)
      }

      toast({ title: 'Order saved', description: mode === 'draft' ? 'Draft saved.' : 'Order placed.' })
      setConfirmation({
        mode: mode === 'draft' ? 'draft' : 'confirmed',
        invoiceNumber,
        customerName: walkIn ? 'Walk-in Customer' : (customer.fullName || customer.phone),
        grandTotal,
        paid: advancePaid,
        pending: dueAmount,
      })

      // Close the parent modal after a short delay so the user sees the toast
      setTimeout(() => { onClose?.() }, 1200)

      if (mode === 'print' && typeof window !== 'undefined') {
        const billHtml = `<html><head><title>Invoice ${invoiceNumber}</title>
          <style>body{font-family:Arial;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}.row{display:flex;justify-content:space-between;margin:4px 0}</style></head><body>
          <h2>Invoice ${invoiceNumber}</h2>
          <div class="row"><span>Customer</span><span>${walkIn ? 'Walk-in' : (customer.fullName || customer.phone)}</span></div>
          <table><thead><tr><th>Product</th><th>Meters</th><th>Rate</th><th>Fabric Total</th><th>Stitching</th><th>Line Total</th></tr></thead><tbody>
          ${items.map((i) => `<tr><td>${i.label || i.fabricVariantId}</td><td>${i.meters}</td><td>₹${i.ratePerMeter.toFixed(2)}</td><td>₹${(i.meters * i.ratePerMeter).toFixed(2)}</td><td>₹${(i.stitchingPrice || 0).toFixed(2)}</td><td>₹${(i.meters * i.ratePerMeter + (i.stitchingPrice || 0)).toFixed(2)}</td></tr>`).join('')}
          </tbody></table>
          <div style="margin-top:16px">
            <div class="row"><span>Fabric Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Stitching</span><span>₹${totalStitching.toFixed(2)}</span></div>
            <div class="row"><span>Discount</span><span>-₹${billDiscount.toFixed(2)}</span></div>
            <div class="row"><b>Grand Total</b><b>₹${grandTotal.toFixed(2)}</b></div>
            <div class="row"><span>Advance Paid</span><span>₹${advancePaid.toFixed(2)}</span></div>
            <div class="row"><span>Amount Due</span><span>₹${dueAmount.toFixed(2)}</span></div>
          </div></body></html>`
        const w = window.open('', '_blank')
        if (w) { w.document.write(billHtml); w.document.close(); w.focus(); w.print() }
      }
      resetForNext()
    } catch (err: unknown) {
      toast({
        title: 'Save failed',
        description: toUiSaveErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div>

      {/* ════ BODY ════════════════════════════════ */}
      <div className="bg-slate-50 dark:bg-slate-950">
        <div className="w-full px-4 py-5 space-y-4">

          {/* ── 1. CUSTOMER DETAILS ────────────────────────── */}
          <AccordionSection
            icon={<UserCircle className="w-4 h-4" />}
            title={t('sales.quick.customer', 'Customer Details')}
            badge={customerInfo ? customerInfo.fullName : customer.fullName || undefined}
            defaultOpen
          >
            {/* Customer found badge */}
            {customerInfo && (
              <div className="mb-4 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{customerInfo.fullName}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {customerInfo.totalOrders} order{customerInfo.totalOrders !== 1 ? 's' : ''} &nbsp;•&nbsp;
                    Due: ₹{(customerInfo.outstandingDue ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Row 1: Name + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.customerName', 'Customer Name')}</label>
                <Input
                  placeholder="Type to search or enter name…"
                  value={customer.fullName}
                  onChange={(e) => {
                    setCustomer({ ...customer, fullName: e.target.value })
                    setShowCustomerSuggestions(true)
                  }}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                  className="h-10"
                />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xl">
                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={async () => {
                          setCustomer({ fullName: c.fullName, phone: c.phone, email: c.email || '', city: c.city || '', address: c.address || '' })
                          setShowCustomerSuggestions(false)
                          setWalkIn(false)
                          // Auto-fill measurements from this customer's saved profile
                          try {
                            const found = await lookupCustomerByPhone(c.phone)
                            if (found) {
                              setCustomerInfo(found)
                              if (found.measurement) {
                                setMeasurement({
                                  chest: found.measurement.chest ?? '',
                                  waist: found.measurement.waist ?? '',
                                  shoulder: found.measurement.shoulder ?? '',
                                  sleeve: found.measurement.sleeve ?? '',
                                  neck: found.measurement.neck ?? '',
                                  hip: found.measurement.hip ?? '',
                                  inseam: found.measurement.inseam ?? '',
                                  length: found.measurement.length ?? '',
                                  customNotes: found.measurement.customNotes ?? '',
                                  photoUrl: found.measurement.photoUrl ?? undefined,
                                  photoFileId: found.measurement.photoFileId ?? undefined,
                                })
                              }
                            }
                          } catch { /* non-fatal */ }
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-border last:border-none transition-colors"
                      >
                        <p className="text-sm font-semibold text-foreground">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {c.phone} {c.city && `• ${c.city}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.customerPhone', 'Phone')}</label>
                <Input
                  placeholder="+91 XXXXX XXXXX"
                  value={customer.phone}
                  inputMode="tel"
                  onBlur={handlePhoneBlur}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            {/* Row 2: Email + Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.emailOptional', 'Email (optional)')}</label>
                <Input
                  placeholder="email@example.com"
                  value={customer.email ?? ''}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="h-10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.addressOptional', 'Address (optional)')}</label>
                <Input
                  placeholder="City / Full address"
                  value={customer.address ?? ''}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            {/* Measurements */}
            <div className="mt-4">
              <CustomerMeasurementsSection
                value={measurement}
                onChange={setMeasurement}
              />
            </div>
          </AccordionSection>

          {/* ── 2. PRODUCTS / ITEMS ────────────────────────── */}
          <AccordionSection
            icon={<ShoppingCart className="w-4 h-4" />}
            title={t('sales.quick.products', 'Products / Items')}
            badge={lineItemSummary.length > 0 ? `${lineItemSummary.length} item${lineItemSummary.length !== 1 ? 's' : ''}` : undefined}
            defaultOpen
          >
            {/* Add item button */}
            <div className="flex justify-end mb-3">
              <Button
                type="button"
                size="sm"
                onClick={() => setItems((p) => [...p, emptyItem()])}
                className="h-8 px-4 rounded-lg gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('sales.quick.addItem', 'Add Item')}
              </Button>
            </div>

            <div className="hidden md:grid grid-cols-[2fr_80px_90px_80px_70px_56px] gap-2 px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{t('sales.quick.productFieldLabel', 'Product')}</span>
              <span className="text-center">{t('sales.quick.meters', 'Meters')}</span>
              <span className="text-center">{t('sales.quick.rate', 'Rate/M (₹)')}</span>
              <span className="text-center">{t('sales.quick.stitch', 'Stitch (₹)')}</span>
              <span className="text-right">{t('sales.quick.total', 'Total')}</span>
              <span />
            </div>

            {/* Item rows */}
            <div className="space-y-2">
              {items.map((item, idx) => {
                const lineTotal = item.meters * item.ratePerMeter + item.stitchingPrice
                const totalRequested = items
                  .filter((x) => x.fabricVariantId === item.fabricVariantId)
                  .reduce((s, x) => s + x.meters, 0)
                const originalTotal = items
                  .filter((x) => x.fabricVariantId === item.fabricVariantId)
                  .reduce((s, x) => s + (x.originalMeters ?? 0), 0)
                const maxAllowedForRow = Math.max(0, item.availableStock || 0) + originalTotal
                const isEffectivelyNewItem = item.isNewVariant || (item._originalDesignName ? hasProductChanged(item) : false)
                const hasStockError = !!item.fabricVariantId && !isEffectivelyNewItem && totalRequested > maxAllowedForRow
                const query = item.searchText.trim().toLowerCase()
                const hasQuery = query.length > 0
                const matchedSuggestions = query
                  ? suggestions.filter((v) =>
                      `${v.designName} ${v.variantName} ${v.color} ${v.category} ${v.skuPrefix ?? ''}`
                        .toLowerCase()
                        .includes(query)
                    )
                  : []
                const visibleSuggestions = matchedSuggestions.slice(0, 20)
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2.5 transition-all ${item.isLocked ? 'bg-white dark:bg-slate-900 border-border' : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'}`}
                  >
                    <div className="flex flex-col md:grid md:grid-cols-[2fr_80px_90px_80px_70px_56px] gap-2 md:items-start">
                      {/* Product search */}
                      <div className="relative">
                        <Input
                          placeholder={t('sales.quick.searchFabric', 'Search fabric by name…')}
                          value={item.searchText}
                          disabled={item.isLocked}
                          hideSpeech={true}
                          onFocus={() => setActiveSuggestionRow(idx)}
                          onBlur={() => setTimeout(() => setActiveSuggestionRow(null), 160)}
                          onChange={(e) => {
                            const nextText = e.target.value
                            const n = [...items]
                            n[idx] = {
                              ...n[idx],
                              searchText: nextText,
                              isLocked: false,
                              ...(nextText.trim()
                                ? { isNewVariant: true, designName: nextText, fabricVariantId: '' }
                                : {
                                    fabricVariantId: '',
                                    label: '',
                                    availableStock: 0,
                                    originalMeters: 0,
                                    isNewVariant: false,
                                    expandDetails: false,
                                  }),
                            }
                            setItems(n)
                            setActiveSuggestionRow(idx)
                          }}
                          className="h-9 text-sm"
                        />
                        {item.label && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-1 px-0.5">
                            ✓ {item.label}
                          </p>
                        )}
                        {/* Product suggestions dropdown */}
                        {!item.isLocked && hasQuery && activeSuggestionRow === idx && visibleSuggestions.length > 0 && (
                          <div className="absolute z-[80] top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xl">
                            {visibleSuggestions.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onMouseDown={(e) => {
                                  // Prevent blur/click chain from triggering nearby row controls.
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onClick={() => {
                                  const n = [...items]
                                  n[idx] = {
                                    ...n[idx],
                                    fabricVariantId: v.id,
                                    searchText: `${v.designName} ${v.variantName}`,
                                    label: `${v.designName} – ${v.variantName} (${v.color})`,
                                    availableStock: v.stockMeters,
                                    originalMeters: n[idx].originalMeters ?? 0,
                                    ratePerMeter: v.sellingPricePerMeter,
                                    isLocked: false,
                                    isNewVariant: false,
                                    expandDetails: true,
                                    designName: v.designName,
                                    category: v.category,
                                    color: v.color,
                                    purchasePricePerMeter: v.purchasePricePerMeter,
                                    initialStockMeters: v.stockMeters,
                                    imageUrl: v.imageUrl || null,
                                    // Store originals for smart comparison
                                    _originalDesignName: v.designName,
                                    _originalCategory: v.category,
                                    _originalColor: v.color,
                                    _originalPurchasePrice: v.purchasePricePerMeter,
                                    _originalSellingPrice: v.sellingPricePerMeter,
                                    _originalImageUrl: v.imageUrl || null,
                                  }
                                  setItems(n)
                                  setActiveSuggestionRow(null)
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-border last:border-none transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Thumbnail */}
                                  <div className="w-10 h-10 rounded-md border border-border bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} alt={v.designName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-4 h-4 opacity-30 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {v.designName} – {v.variantName}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                                      <span>{v.color}</span>
                                      <span className="text-primary font-semibold">₹{v.sellingPricePerMeter}/m</span>
                                      <span>Stock: {v.stockMeters}m</span>
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Meters */}
                      <div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={item.meters === 0 ? '' : item.meters}
                          disabled={item.isLocked}
                          hideSpeech
                          onChange={(e) => { 
                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                            const n = [...items]; 
                            n[idx] = { ...n[idx], meters: val === '' ? 0 : parseFloat(val) || 0 }; 
                            setItems(n) 
                          }}
                          className={`h-9 text-center text-sm px-2 ${hasStockError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          placeholder="Meters"
                        />
                        {hasStockError && (
                          <p className="mt-1 text-[10px] font-semibold text-red-600">
                            Only {maxAllowedForRow}m available.
                          </p>
                        )}
                      </div>

                      {/* Rate */}
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={item.ratePerMeter === 0 ? '' : item.ratePerMeter}
                        disabled={item.isLocked}
                        hideSpeech
                        onChange={(e) => { 
                          const val = e.target.value.replace(/^0+(?=\d)/, '');
                          const n = [...items]; 
                          n[idx] = { ...n[idx], ratePerMeter: val === '' ? 0 : parseFloat(val) || 0 }; 
                          setItems(n) 
                        }}
                        className="h-9 text-center text-sm px-2"
                      />

                      {/* Stitching */}
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={item.stitchingPrice === 0 ? '' : item.stitchingPrice}
                        disabled={item.isLocked}
                        hideSpeech
                        onChange={(e) => { 
                          const val = e.target.value.replace(/^0+(?=\d)/, '');
                          const n = [...items]; 
                          n[idx] = { ...n[idx], stitchingPrice: val === '' ? 0 : parseFloat(val) || 0 }; 
                          setItems(n) 
                        }}
                        className="h-9 text-center text-sm px-2"
                      />

                      {/* Total */}
                      <div className="h-9 flex items-center justify-end pr-1">
                        <span className="text-sm font-semibold text-foreground">₹{lineTotal.toFixed(0)}</span>
                      </div>

                      {/* Confirm / Delete */}
                      <div className="flex gap-1 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => { const n = [...items]; n[idx] = { ...n[idx], isLocked: !item.isLocked }; setItems(n) }}
                          disabled={!item.fabricVariantId && !item.isNewVariant}
                          title={item.isLocked ? 'Edit' : 'Confirm'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 ${item.isLocked ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 hover:bg-emerald-200'}`}
                        >
                          {item.isLocked ? <Pencil className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)) }}
                          disabled={items.length <= 1}
                          title="Remove"
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stitch Types & Tailors - Inline Compact */}
                    {(item.stitchingPrice > 0 || (item.stitchAssignments && item.stitchAssignments.length > 0) || (item.stitchTypes && item.stitchTypes.length > 0)) && (
                      <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-violet-600" />
                          <label className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                            {t('sales.quick.tailorAssignments', 'Stitch Assignments')}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          {/* Existing Assignments */}
                          {(item.stitchAssignments || []).map((assign, aIdx) => (
                            <div key={aIdx} className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-300/60 transition-all">
                              
                              {/* Left Section: Badge & Tailor */}
                              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                {/* Badge & Remove */}
                                <div className="flex items-center gap-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1.5 rounded-md font-bold text-xs shrink-0">
                                  <span className="truncate max-w-[90px]">{assign.stitchTypeName}</span>
                                  <X 
                                    className="w-3.5 h-3.5 cursor-pointer hover:text-red-500 transition-colors ml-1 shrink-0" 
                                    onClick={() => {
                                      const n = [...items]
                                      n[idx].stitchAssignments!.splice(aIdx, 1)
                                      n[idx].stitchTypes = n[idx].stitchAssignments!.map(a => a.stitchTypeName)
                                      setItems(n)
                                    }} 
                                  />
                                </div>

                                {/* Tailor Select */}
                                <Select
                                  value={assign.tailors.length > 0 ? assign.tailors[0].tailorId : ''}
                                  onValueChange={(val) => {
                                    const selectedT = availableTailors.find(at => at.id === val)
                                    if (!selectedT) return
                                    
                                    const n = [...items]
                                    const currentAssign = n[idx].stitchAssignments![aIdx]
                                    const price = selectedT.prices[currentAssign.stitchTypeName.toLowerCase()] || 0
                                    
                                    if (currentAssign.tailors.length === 0) {
                                      currentAssign.tailors.push({ tailorId: val, tailorName: selectedT.full_name, quantity: 1, tailorPrice: price })
                                    } else {
                                      currentAssign.tailors[0].tailorId = val
                                      currentAssign.tailors[0].tailorName = selectedT.full_name
                                      currentAssign.tailors[0].tailorPrice = price
                                    }

                                    setItems(n)
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-none focus:ring-violet-500 w-full min-w-[120px]">
                                    <SelectValue placeholder={t('sales.quick.selectTailor', 'Select Tailor')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableTailors.map(at => (
                                      <SelectItem key={at.id} value={at.id}>{at.full_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Right Section: Qty & Prices */}
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {/* Qty +/- */}
                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 h-8 shrink-0 overflow-hidden">
                                  <button 
                                    type="button"
                                    className="w-8 h-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const n = [...items]
                                      const t = n[idx].stitchAssignments![aIdx].tailors[0]
                                      if (t && t.quantity > 1) {
                                        t.quantity -= 1
                                        setItems(n)
                                      }
                                    }}
                                  >-</button>
                                  <Input 
                                    type="number"
                                    className="w-10 h-full text-center text-xs font-bold border-none bg-transparent shadow-none px-0 focus-visible:ring-0 text-slate-700 dark:text-slate-300"
                                    value={assign.tailors.length > 0 ? assign.tailors[0].quantity : 1}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                                      const num = val === '' ? 1 : parseInt(val) || 1;
                                      const n = [...items]
                                      if (n[idx].stitchAssignments![aIdx].tailors.length === 0) {
                                        n[idx].stitchAssignments![aIdx].tailors.push({ tailorId: '', tailorName: '', quantity: num, tailorPrice: 0 })
                                      } else {
                                        n[idx].stitchAssignments![aIdx].tailors[0].quantity = Math.max(1, num)
                                      }
                                      setItems(n)
                                    }}
                                  />
                                  <button 
                                    type="button"
                                    className="w-8 h-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const n = [...items]
                                      if (n[idx].stitchAssignments![aIdx].tailors.length === 0) {
                                        n[idx].stitchAssignments![aIdx].tailors.push({ tailorId: '', tailorName: '', quantity: 2, tailorPrice: 0 })
                                      } else {
                                        n[idx].stitchAssignments![aIdx].tailors[0].quantity += 1
                                      }
                                      setItems(n)
                                    }}
                                  >+</button>
                                </div>

                                {/* Tailor Price */}
                                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 h-8 px-2 w-[72px] shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                                  <Scissors className="w-3 h-3 text-slate-400 shrink-0" />
                                  <Input 
                                    type="number" 
                                    className="h-full w-full text-[11px] text-right font-medium text-slate-600 dark:text-slate-400 px-1 border-none bg-transparent shadow-none focus-visible:ring-0" 
                                    placeholder="Cost"
                                    title="Tailor Cost"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    value={assign.tailors.length > 0 ? (assign.tailors[0].tailorPrice === 0 ? '' : assign.tailors[0].tailorPrice) : ''}
                                    onChange={e => {
                                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                                      const n = [...items]
                                      if (n[idx].stitchAssignments![aIdx].tailors.length > 0) {
                                        n[idx].stitchAssignments![aIdx].tailors[0].tailorPrice = val === '' ? 0 : parseFloat(val) || 0
                                        setItems(n)
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Dropdown */}
                          <div className="pt-2">
                            <Select
                              value=""
                              onValueChange={(val) => {
                                if (!val) return;
                                const n = [...items]
                                n[idx].stitchTypes = [...(n[idx].stitchTypes || []), val]
                                n[idx].stitchAssignments = [...(n[idx].stitchAssignments || []), {
                                  stitchTypeName: val,
                                  customerPrice: 0,
                                  tailors: []
                                }]
                                setItems(n)
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-dashed border-violet-300 w-full flex justify-center text-violet-600 font-semibold hover:bg-violet-50 transition-colors shadow-sm rounded-lg">
                                <Plus className="w-4 h-4 mr-1.5" /> {t('sales.quick.addStitchType', 'Add Stitch Type')}
                              </SelectTrigger>
                              <SelectContent>
                                {availableStitchTypes.map(st => (
                                  <SelectItem key={st.id} value={st.name}>
                                    {st.name} {st.isPopular && '⭐'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {(item.stitchAssignments?.length === 0 || !item.stitchAssignments) && (
                          <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center">
                            Please add at least one stitch type
                          </p>
                        )}
                      </div>
                    )}

                    {/* Expanded Product Details Card */}
                    {item.expandDetails && !item.isLocked && (
                      <div className="mt-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-4 p-4">
                          {/* Product Photo */}
                          <div className="w-20 h-20 rounded-lg border border-border bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.designName || 'Fabric'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-8 h-8 opacity-30" />
                              </div>
                            )}
                          </div>

                          {/* Editable Fields Grid */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Design Name</label>
                              <Input
                                value={item.designName || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], designName: e.target.value }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="e.g. Raymond Silk"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Category</label>
                              <Input
                                value={item.category || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], category: e.target.value }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="e.g. Cotton"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Color</label>
                              <Input
                                value={item.color || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], color: e.target.value }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="e.g. Red"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Purchase ₹/m</label>
                              <Input
                                type="text" inputMode="decimal"
                                value={item.purchasePricePerMeter || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], purchasePricePerMeter: parseFloat(e.target.value) || 0 }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="₹"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Selling ₹/m</label>
                              <Input
                                type="text" inputMode="decimal"
                                value={item.ratePerMeter || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], ratePerMeter: parseFloat(e.target.value) || 0 }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="₹"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Total Stock (m)</label>
                              <Input
                                type="text" inputMode="decimal"
                                value={item.initialStockMeters || ''}
                                onChange={e => { const n = [...items]; n[idx] = { ...n[idx], initialStockMeters: parseFloat(e.target.value) || 0 }; setItems(n); }}
                                className="h-8 text-sm"
                                placeholder="Meters"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Smart Comparison Badge inside card */}
                        <div className="px-4 pb-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => { const n = [...items]; n[idx] = { ...n[idx], expandDetails: false }; setItems(n); }}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline"
                          >
                            Collapse details
                          </button>
                          {(() => {
                            const changed = hasProductChanged(item)
                            if (item._originalDesignName && changed) {
                              return (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  New Variant Will Be Created
                                </span>
                              )
                            }
                            if (item._originalDesignName && !changed) {
                              return (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Existing Product — Stock will be deducted
                                </span>
                              )
                            }
                            return (
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                                New Product
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Collapsed Badge row */}
                    {!item.expandDetails && (
                      <div className="mt-1 flex items-center justify-between px-1">
                        {(item.fabricVariantId || item.isNewVariant) && (
                          <button
                            type="button"
                            onClick={() => { const n = [...items]; n[idx] = { ...n[idx], expandDetails: true }; setItems(n); }}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Show details
                          </button>
                        )}
                        <div className="ml-auto">
                          {(() => {
                            const changed = item._originalDesignName ? hasProductChanged(item) : item.isNewVariant
                            if (changed) {
                              return (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                  New Variant
                                </span>
                              )
                            }
                            if (item.fabricVariantId) {
                              return (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                  Existing Product
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                      </div>
                    )}
                    </div>
                )
              })}
            </div>

            {/* Items subtotal */}
            <div className="mt-3 flex justify-end gap-6 text-sm px-2">
              <span className="text-muted-foreground">Fabric: <span className="font-semibold text-foreground">₹{subtotal.toLocaleString()}</span></span>
              {totalStitching > 0 && (
                <span className="text-muted-foreground">Stitching: <span className="font-semibold text-violet-600">₹{totalStitching.toLocaleString()}</span></span>
              )}
            </div>
          </AccordionSection>

          {/* ── 3. ORDER DETAILS ───────────────────────────── */}
          <AccordionSection
            icon={<NotebookTabs className="w-4 h-4" />}
            title={t('sales.quick.notes', 'Order Details')}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.notes', 'Order Notes')}</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10" placeholder="Internal instructions…" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.salesperson', 'Salesperson')}</label>
                <Input value={salespersonName} onChange={(e) => setSalespersonName(e.target.value)} className="h-10" placeholder="Staff name" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox id="priority" checked={priorityCustomer} onCheckedChange={(c) => setPriorityCustomer(c === true)} />
                <span className="text-sm font-medium text-foreground">Priority Order</span>
                {priorityCustomer && <Sparkles className="w-4 h-4 text-amber-500 ml-auto animate-pulse" />}
              </label>

              {/* Draft loader */}
              {drafts.length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <History className="w-3.5 h-3.5" /> Load Saved Draft
                  </label>
                  <Select
                    value={selectedDraftId}
                    onValueChange={async (id) => {
                      setSelectedDraftId(id)
                      if (!id || id === '__none__') { setEditTargetId(null); return }
                      try {
                        setSubmitting(true)
                        const d = await fetchOrderById(id)
                        setEditTargetId(id)
                        setInvoiceNumber(d.invoiceNumber || genInvoiceNumber())
                        setAdvancePaid(d.advancePaid ?? 0)
                        setPaymentMethod((d.paymentMethod as 'cash' | 'upi' | 'card' | 'mixed') || 'cash')
                        setPaymentStatus((d.paymentStatus as 'paid' | 'pending') || 'pending')
                        setManualPaymentStatus(true)
                        setNotes(d.notes || '')
                        setWalkIn(!d.customer)
                        if (d.customer) setCustomer((p) => ({ ...p, fullName: d.customer?.fullName ?? '', phone: d.customer?.phone ?? '' }))
                        
                        // Fetch live stock for draft items
                        const loaded = await Promise.all((d.items || []).map(async (it: any) => {
                          let liveStock = it.meters;
                          try {
                            const variant = await inventoryApi.getFabricById(it.fabricVariantId);
                            liveStock = variant.stockMeters;
                          } catch { /* fallback to current quantity */ }

                          return {
                            fabricVariantId: it.fabricVariantId,
                            searchText: it.fabricVariant?.design?.designName || '',
                            label: `${it.fabricVariant?.design?.designName || ''} – ${it.fabricVariant?.variantName || ''} (${it.fabricVariant?.color || ''})`.trim(),
                            availableStock: liveStock,
                            originalMeters: it.meters,
                            meters: it.meters,
                            ratePerMeter: it.ratePerMeter,
                            stitchingPrice: it.stitchingPrice || 0,
                            isLocked: true,
                            stitchTypes: [],
                          }
                        }))
                        setItems(loaded.length ? loaded : [emptyItem()])
                      } catch (err) {
                        toast({ title: 'Draft failed', description: 'Unable to load draft data.', variant: 'destructive' })
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Select a draft…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="__none__" disabled>Pick a draft…</SelectItem>
                      {drafts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="font-semibold">#{d.invoiceNumber}</span>
                          <span className="text-xs opacity-50 ml-2">• {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editTargetId && (
                    <button type="button" onClick={() => { setSelectedDraftId(''); setEditTargetId(null) }} className="text-xs text-amber-600 hover:underline">
                      ✕ Clear draft
                    </button>
                  )}
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Side-by-side row at last */}
          <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
            {/* ── 4. PAYMENT & BILLING (30%) ────────────────── */}
            <div className="w-full lg:w-[35%] shrink-0">
              <AccordionSection
                icon={<IndianRupee className="w-4 h-4" />}
                title={t('sales.quick.billing', 'Payment & Billing')}
                defaultOpen
              >
                <div className="space-y-5">
                  {/* Row 1: Discount + Advance Paid */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.discount', 'Discount')} (₹)</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        hideSpeech
                        value={billDiscount}
                        onChange={(e) => { const v = parseFloat(e.target.value); setBillDiscount(Number.isFinite(v) ? v : 0) }}
                        className="h-10"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('sales.quick.advancePaid', 'Advance Paid')} (₹)</label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        hideSpeech
                        value={advancePaid}
                        onChange={(e) => { const v = parseFloat(e.target.value); setAdvancePaid(Number.isFinite(v) ? v : 0) }}
                        className="h-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('sales.quick.paymentMethod', 'Payment Method')}</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(['cash', 'upi', 'card', 'mixed'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 px-1 rounded-xl text-[10px] font-semibold capitalize border transition-all ${paymentMethod === m ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-800 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('sales.quick.paymentStatus', 'Payment Status')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['paid', 'pending'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setPaymentStatus(s); setManualPaymentStatus(true) }}
                          className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${paymentStatus === s
                              ? s === 'paid' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white dark:bg-slate-800 border-border text-muted-foreground hover:border-primary/50'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div>

            {/* ── 5. ORDER SUMMARY (70%) ────────────────────── */}
            <div className="w-full lg:flex-1">
              <AccordionSection
                icon={<BarChart3 className="w-4 h-4" />}
                title={t('dashboard.totalOrders', 'Order Summary')}
                defaultOpen
              >
                <div className="space-y-4">

                  {/* Itemized product list */}
                  {lineItemSummary.length > 0 && (
                    <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Product Detail</span>
                        <span className="text-right w-20">Fabric</span>
                        <span className="text-right w-20">Stitch</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lineItemSummary.map((item, i) => {
                          const fabricCost = item.meters * item.ratePerMeter
                          return (
                            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 items-start group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="min-w-0 pr-4">
                                <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">{item.meters}m</span>
                                  <span>×</span>
                                  <span>₹{item.ratePerMeter}/m</span>
                                </p>
                              </div>
                              <span className="text-xs font-bold text-foreground whitespace-nowrap w-20 text-right py-1">₹{fabricCost.toLocaleString()}</span>
                              <span className={`text-xs font-bold whitespace-nowrap w-20 text-right py-1 ${item.stitchingPrice > 0 ? 'text-violet-600' : 'text-muted-foreground'}`}>
                                {item.stitchingPrice > 0 ? `₹${item.stitchingPrice.toLocaleString()}` : '—'}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 bg-slate-50/80 dark:bg-slate-900 border-t-2 border-dashed border-border">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('sales.quick.subtotal', 'Sub-Totals')}</span>
                        <span className="text-sm font-black text-foreground w-20 text-right">₹{subtotal.toLocaleString()}</span>
                        <span className="text-sm font-black text-violet-600 w-20 text-right">{totalStitching > 0 ? `₹${totalStitching.toLocaleString()}` : '—'}</span>
                      </div>
                    </div>
                  )}

                  {/* Final Calculation details */}
                  <div className="bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl p-4 border border-border/60">
                    <div className="space-y-3">
                      {/* Total Before Discount */}
                      {billDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm px-1">
                          <span className="text-muted-foreground font-semibold">Total Amount</span>
                          <span className="font-bold text-foreground">₹{(subtotal + totalStitching).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Discount line with Percentage */}
                      {billDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm px-1">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground font-semibold">{t('sales.quick.discount', 'Bill Discount')}</span>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                              {((billDiscount / (subtotal + totalStitching)) * 100).toFixed(1)}% OFF
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                            −₹{billDiscount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Grand Total */}
                      <div className={`pt-3 border-t border-border/80 flex justify-between items-center px-1 ${billDiscount === 0 ? 'mt-0 border-none pt-0' : ''}`}>
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-0.5">Final Payable</span>
                          <span className="text-lg font-black text-foreground">{t('sales.quick.grandTotal', 'Grand Total')}</span>
                        </div>
                        <span className="text-3xl font-black text-primary tracking-tight">₹{grandTotal.toLocaleString()}</span>
                      </div>

                      {/* Paid / Due cards */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t('sales.quick.advancePaid', 'Advance Received')}</p>
                          <p className="text-2xl font-black text-emerald-600">₹{advancePaid.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-2xl p-4 text-center border-2 ${dueAmount > 0 ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10' : 'bg-slate-50 dark:bg-slate-900 border-dashed border-border'}`}>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dueAmount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{t('sales.quick.dueAmount', 'Net Balance Due')}</p>
                          <p className={`text-2xl font-black ${dueAmount > 0 ? 'text-amber-600' : 'text-slate-300'}`}>₹{dueAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div>
          </div>
        </div>{/* end max-w-4xl */}
      </div>{/* end scrollable body */}

      {/* ════ ACTION BAR ════════════════════════════════════ */}
      <div className="border-t border-border bg-white dark:bg-slate-900 sticky bottom-0 z-10 px-4 py-4">
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          <Button
            type="button"
            onClick={() => void submit('new')}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving…' : t('sales.quick.saveAndNew', 'Save Order')}
          </Button>
          <Button
            type="button"
            onClick={() => void submit('print')}
            disabled={submitting}
            variant="outline"
            className="flex-1 sm:flex-none sm:w-36 h-11 rounded-xl font-semibold gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('sales.quick.saveAndPrint', 'Save & Print')}
          </Button>
          <Button
            type="button"
            onClick={() => void submit('draft')}
            disabled={submitting}
            variant="ghost"
            className="flex-1 sm:flex-none sm:w-32 h-11 rounded-xl font-semibold gap-2 text-muted-foreground"
          >
            <FileEdit className="w-4 h-4" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* ════ ORDER CONFIRMATION DIALOG ═══════════════════════ */}
      <Dialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950">
          <span className="sr-only">
            <DialogTitle>{confirmation?.mode === 'draft' ? 'Draft Saved' : 'Order Placed'}</DialogTitle>
            <DialogDescription>Transaction confirmation</DialogDescription>
          </span>
          {/* Banner */}
          <div className={`px-8 py-8 text-center text-white ${confirmation?.mode === 'draft' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary to-blue-700'}`}>
            <div className="mx-auto w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              {confirmation?.mode === 'draft' ? <FileEdit className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <h2 className="text-xl font-bold">{confirmation?.mode === 'draft' ? 'Draft Saved!' : 'Order Placed!'}</h2>
            <p className="text-white/75 text-xs font-semibold mt-1 uppercase tracking-widest">Invoice #{confirmation?.invoiceNumber}</p>
          </div>
          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-border">
              <UserCircle className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Customer</p>
                <p className="text-sm font-bold text-foreground">{confirmation?.customerName}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-border">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total</p>
                <p className="text-sm font-bold">₹{confirmation?.grandTotal.toLocaleString()}</p>
              </div>
              {(confirmation?.paid ?? 0) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900">
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Paid</p>
                  <p className="text-sm font-bold text-emerald-600">₹{confirmation?.paid.toLocaleString()}</p>
                </div>
              )}
              {(confirmation?.pending ?? 0) > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-100 dark:border-amber-900">
                  <p className="text-[10px] text-amber-600 font-semibold uppercase">Due</p>
                  <p className="text-sm font-bold text-amber-600">₹{confirmation?.pending.toLocaleString()}</p>
                </div>
              )}
            </div>
            <Button onClick={() => setConfirmation(null)} className="w-full h-11 rounded-xl font-semibold">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
