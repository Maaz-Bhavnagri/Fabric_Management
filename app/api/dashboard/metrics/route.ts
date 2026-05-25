import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

export async function GET(request: Request) {
  try {
    const auth = await requireSupabaseUser();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const startIso = startDate.toISOString();
    const todayIso = new Date().toISOString().split('T')[0];

    // Parallel fetch base data
    // 1. Lifetime Data
    const [
      { count: totalCustomers }, 
      { data: variants },
      { data: allInvoicesLifetime },
      { count: overdueOrders },
      { count: urgentOrders },
    ] = await Promise.all([
      admin.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('fabric_variants').select('stock_meters, purchase_price_per_meter').eq('is_active', true),
      admin.from('invoices').select('customer_id').eq('is_draft', false),
      admin.from('invoices').select('*', { count: 'exact', head: true }).eq('is_draft', false).lt('expected_delivery_date', todayIso).neq('workflow_status', 'delivered'),
      admin.from('invoices').select('*', { count: 'exact', head: true }).eq('is_draft', false).eq('priority', 'Urgent').neq('workflow_status', 'delivered'),
    ]);

    // 2. Time-Filtered Invoices
    const { data: rangeInvoices } = await admin
      .from('invoices')
      .select(`
        id, grand_total, total_fabric_amount, total_stitching_amount, created_at, payment_status, advance_paid
      `)
      .eq('is_draft', false)
      .gte('created_at', startIso);

    const invList = rangeInvoices ?? [];
    const invIds = invList.map((i: any) => i.id);

    // Calculate core metrics
    const totalRevenue = invList.reduce((s, i) => s + (i.grand_total || 0), 0);
    const totalOrders = invList.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const totalFabricRevenue = invList.reduce((s, i) => s + (i.total_fabric_amount || 0), 0);
    const totalStitchingRevenue = invList.reduce((s, i) => s + (i.total_stitching_amount || 0), 0);

    const inventoryValue = variants?.reduce((acc, curr) => acc + (curr.stock_meters || 0) * (curr.purchase_price_per_meter || 0), 0) ?? 0;

    // Fetch Stitch Entries for the time range
    let totalTailorExpenses = 0;
    let totalStitchProfit = 0;
    let rangeStitchEntries: any[] = [];
    
    if (invIds.length > 0) {
      const { data: stitchEntries } = await admin
        .from('order_stitch_entries')
        .select(`
          id, invoice_id, total_tailor_amount, total_customer_amount, tailor_id, stitch_type_id,
          tailors(full_name), invoice_item_stitch_types(name)
        `)
        .in('invoice_id', invIds);
        
      if (stitchEntries) {
        rangeStitchEntries = stitchEntries;
        stitchEntries.forEach(entry => {
          totalTailorExpenses += Number(entry.total_tailor_amount || 0);
        });
      }
    }
    totalStitchProfit = totalStitchingRevenue - totalTailorExpenses;

    // Payment Status Grouping
    const paymentGroups = new Map<string, { count: number; amount: number }>();
    for (const inv of invList) {
      const g = paymentGroups.get(inv.payment_status) ?? { count: 0, amount: 0 };
      g.count += 1;
      // If paid, sum grand_total. If pending, sum grand_total - advance_paid
      if (inv.payment_status === 'paid') {
        g.amount += (inv.grand_total || 0);
      } else {
        const pendingAmt = (inv.grand_total || 0) - (inv.advance_paid || 0);
        g.amount += pendingAmt;
      }
      paymentGroups.set(inv.payment_status, g);
    }
    const paymentStatus = [...paymentGroups.entries()].map(([status, g]) => ({
      status, count: g.count, amount: g.amount
    }));

    // Top Tailors & Most Profitable Stitch Types (from rangeStitchEntries)
    const tailorMap = new Map<string, { name: string, payout: number, items: number, completed: number }>();
    const stitchTypeMap = new Map<string, { name: string, profit: number }>();

    for (const se of rangeStitchEntries) {
      // Tailors
      const tId = se.tailor_id;
      const tDataRaw = se.tailors;
      const tName = (Array.isArray(tDataRaw) ? tDataRaw[0]?.full_name : tDataRaw?.full_name) || 'Unknown Tailor';
      
      const tData = tailorMap.get(tId) ?? { name: tName, payout: 0, items: 0, completed: 0 };
      tData.payout += Number(se.total_tailor_amount || 0);
      tData.items += 1;
      tData.completed += 1; 
      tailorMap.set(tId, tData);

      // Stitch Types
      const stId = se.stitch_type_id;
      const stDataRaw = se.invoice_item_stitch_types;
      const stName = (Array.isArray(stDataRaw) ? stDataRaw[0]?.name : stDataRaw?.name) || 'Unknown Stitch';
      
      const stData = stitchTypeMap.get(stId) ?? { name: stName, profit: 0 };
      const custPrice = Number(se.total_customer_amount || 0);
      const tailorPrice = Number(se.total_tailor_amount || 0);
      stData.profit += (custPrice - tailorPrice);
      stitchTypeMap.set(stId, stData);
    }

    const topTailors = [...tailorMap.values()]
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 5)
      .map(t => ({ tailorName: t.name, totalPayout: t.payout, assignedItems: t.items, completionCount: t.completed }));

    const mostProfitableStitchTypes = [...stitchTypeMap.values()]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(s => ({ stitchType: s.name, profit: s.profit }));

    // Top Selling Fabrics, Revenue by Category, Color Popularity
    let topSellingFabrics: any[] = [];
    let categoryRevenue: any[] = [];
    let colorPopularity: any[] = [];

    if (invIds.length > 0) {
      const { data: items } = await admin
        .from('invoice_items')
        .select(`
          invoice_id, fabric_variant_id, meters, line_total, rate_per_meter,
          fabric_variants(variant_name, color, fabric_designs(category, design_name))
        `)
        .in('invoice_id', invIds);

      // Aggregations
      const fabAgg = new Map<string, { revenue: number, meters: number, orderIds: Set<string>, name: string }>();
      const catAgg = new Map<string, number>();
      const colorAgg = new Map<string, { meters: number, revenue: number }>();

      for (const it of items ?? []) {
        const fv = Array.isArray(it.fabric_variants) ? it.fabric_variants[0] : it.fabric_variants;
        const color = fv?.color || 'Unknown';
        const dsg = Array.isArray(fv?.fabric_designs) ? fv?.fabric_designs[0] : fv?.fabric_designs;
        const cat = dsg?.category || 'Other';
        const dname = dsg?.design_name || '';
        const vname = fv?.variant_name || '';
        const fullName = `${dname} (${vname})`.trim() || 'Unknown Fabric';

        // Fabric
        if (it.fabric_variant_id) {
          const fData = fabAgg.get(it.fabric_variant_id) ?? { revenue: 0, meters: 0, orderIds: new Set<string>(), name: fullName };
          fData.revenue += Number(it.line_total || 0); 
          fData.meters += Number(it.meters || 0);
          fData.orderIds.add(it.invoice_id);
          fabAgg.set(it.fabric_variant_id, fData);
        }

        // Category
        catAgg.set(cat, (catAgg.get(cat) ?? 0) + Number(it.line_total || 0));

        // Color
        const colData = colorAgg.get(color) ?? { meters: 0, revenue: 0 };
        colData.meters += Number(it.meters || 0);
        colData.revenue += Number(it.line_total || 0);
        colorAgg.set(color, colData);
      }

      topSellingFabrics = [...fabAgg.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(f => ({ name: f.name, meters: f.meters, revenue: f.revenue, orders: f.orderIds.size }));

      categoryRevenue = [...catAgg.entries()]
        .map(([name, value]) => ({ name, value, percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);

      colorPopularity = [...colorAgg.entries()]
        .map(([color, data]) => ({ color, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    }

    // Customer Retention (Lifetime)
    const orderCountByCustomer = new Map<string, number>();
    for (const r of allInvoicesLifetime ?? []) {
      if (r.customer_id) {
        orderCountByCustomer.set(r.customer_id, (orderCountByCustomer.get(r.customer_id) ?? 0) + 1);
      }
    }
    const repeatCustomersCount = [...orderCountByCustomer.values()].filter(c => c > 1).length;
    const totalCustomersWithOrders = orderCountByCustomer.size;
    const customerRetention = {
      new: totalCustomersWithOrders - repeatCustomersCount,
      repeat: repeatCustomersCount,
      rate: totalCustomersWithOrders > 0 ? (repeatCustomersCount / totalCustomersWithOrders) * 100 : 0,
    };

    // Revenue vs Profit Chart (Adaptive Grouping)
    const chartMap = new Map<string, { revenue: number; cost: number }>();
    
    const getBucketKey = (dateStr: string) => {
      const d = new Date(dateStr);
      if (range === 'today' || range === '7d' || range === '30d') {
        return d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      }
      return d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
    };

    if (range === 'today' || range === '7d' || range === '30d') {
      const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        chartMap.set(getBucketKey(d.toISOString()), { revenue: 0, cost: 0 });
      }
    } else {
      const months = range === '3m' ? 3 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartMap.set(getBucketKey(d.toISOString()), { revenue: 0, cost: 0 });
      }
    }

    const invCostMap = new Map<string, number>(); 
    for (const se of rangeStitchEntries) {
      invCostMap.set(se.invoice_id, (invCostMap.get(se.invoice_id) ?? 0) + Number(se.total_tailor_amount || 0));
    }

    if (invIds.length > 0) {
      const { data: costItems } = await admin
        .from('invoice_items')
        .select(`invoice_id, meters, fabric_variants(purchase_price_per_meter)`)
        .in('invoice_id', invIds);
        
      for (const it of costItems ?? []) {
        const fv = Array.isArray(it.fabric_variants) ? it.fabric_variants[0] : it.fabric_variants;
        const purchase = Number(fv?.purchase_price_per_meter || 0);
        const fcost = Number(it.meters || 0) * purchase;
        invCostMap.set(it.invoice_id, (invCostMap.get(it.invoice_id) ?? 0) + fcost);
      }
    }

    for (const inv of invList) {
      const bucket = getBucketKey(inv.created_at);
      if (chartMap.has(bucket)) {
        const bData = chartMap.get(bucket)!;
        bData.revenue += Number(inv.grand_total || 0);
        bData.cost += (invCostMap.get(inv.id) ?? 0);
        chartMap.set(bucket, bData);
      }
    }

    const revenueVsProfit = [...chartMap.entries()].map(([period, data]) => ({
      period,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.revenue - data.cost,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers: totalCustomers ?? 0,
        inventoryValue,
        monthlyRevenue: totalRevenue,
        totalFabricRevenue,
        totalStitchingRevenue,
        totalTailorExpenses,
        totalStitchProfit,
        topSellingFabrics,
        categoryRevenue,
        revenueVsProfit,
        paymentStatus,
        customerRetention,
        colorPopularity,
        overdueOrders: overdueOrders ?? 0,
        urgentOrders: urgentOrders ?? 0,
        averageOrderValue,
        topTailors,
        mostProfitableStitchTypes,
      },
    });
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: toPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
