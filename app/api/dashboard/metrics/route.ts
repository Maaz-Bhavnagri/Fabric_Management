import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSupabaseUser } from '@/lib/supabase/require-user';
import { toPublicErrorMessage } from '@/lib/api-errors';

type FabricVariantEmbed = {
  color?: string | null;
  variant_name?: string;
  purchase_price_per_meter?: number;
  design?: { category?: string | null; design_name?: string } | null;
};

type MonthlyInvoiceItem = {
  line_total?: number;
  meters: number;
  fabric_variant?: FabricVariantEmbed | FabricVariantEmbed[] | null;
};

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

    const [{ count: totalCustomers }, { count: totalFabrics }, { data: rangeInvoices }, { data: variants }] =
      await Promise.all([
        admin.from('customers').select('*', { count: 'exact', head: true }),
        admin.from('fabric_variants').select('*', { count: 'exact', head: true }).eq('is_active', true),
        admin
          .from('invoices')
          .select(
            'id, grand_total, total_fabric_amount, total_stitching_amount, created_at, payment_status, customer_id',
          )
          .eq('is_draft', false)
          .gte('created_at', startIso),
        admin.from('fabric_variants').select('stock_meters, purchase_price_per_meter').eq('is_active', true),
      ]);

    const invList = rangeInvoices ?? [];
    const totalRevenue = invList.reduce((s, i) => s + i.grand_total, 0);
    const totalOrders = invList.length;
    const totalFabricRevenue = invList.reduce((s, i) => s + (i.total_fabric_amount ?? 0), 0);
    const totalStitchingRevenue = invList.reduce((s, i) => s + (i.total_stitching_amount ?? 0), 0);

    const invIds = invList.map((i) => i.id);

    let totalTailorExpenses = 0;
    let totalStitchProfit = 0;
    
    if (invIds.length > 0) {
      const { data: stitchEntries } = await admin
        .from('order_stitch_entries')
        .select('total_tailor_amount, total_profit')
        .in('invoice_id', invIds);
        
      if (stitchEntries) {
        stitchEntries.forEach(entry => {
          totalTailorExpenses += Number(entry.total_tailor_amount || 0);
          totalStitchProfit += Number(entry.total_profit || 0);
        });
      }
    }

    const inventoryValue =
      variants?.reduce((acc, curr) => acc + curr.stock_meters * curr.purchase_price_per_meter, 0) ?? 0;

    let topSellingFabrics: Array<{ name: string; meters: number; revenue: number; orders: number }> = [];
    let categoryRevenue: Array<{ name: string; value: number; percentage: number }> = [];
    let colorPopularity: Array<{ color: string; meters: number; revenue: number }> = [];

    if (invIds.length > 0) {
      const { data: items } = await admin
        .from('invoice_items')
        .select('fabric_variant_id, meters, line_total')
        .in('invoice_id', invIds);

      const agg = new Map<string, { revenue: number; meters: number; orders: number }>();
      for (const it of items ?? []) {
        const cur = agg.get(it.fabric_variant_id) ?? { revenue: 0, meters: 0, orders: 0 };
        cur.revenue += it.line_total;
        cur.meters += it.meters;
        cur.orders += 1;
        agg.set(it.fabric_variant_id, cur);
      }

      const sorted = [...agg.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
      const fids = sorted.map((x) => x[0]);
      if (fids.length > 0) {
        const { data: fvs } = await admin
          .from('fabric_variants')
          .select('id, variant_name, color, design:fabric_designs(design_name)')
          .in('id', fids);

        topSellingFabrics = sorted.map(([fid, v]) => {
          const fv = fvs?.find((f) => f.id === fid);
          const dname = (fv?.design as { design_name?: string } | null)?.design_name ?? '';
          return {
            name: fv ? `${dname} (${fv.variant_name})` : 'Unknown',
            revenue: v.revenue,
            meters: v.meters,
            orders: v.orders,
          };
        });
      }

      const { data: allItems } = await admin
        .from('invoice_items')
        .select(
          `
          line_total,
          meters,
          fabric_variant:fabric_variants(
            color,
            design:fabric_designs(category)
          )
        `,
        )
        .in('invoice_id', invIds);

      const categoryMap: Record<string, number> = {};
      const colorMap: Record<string, { meters: number; revenue: number }> = {};

      for (const row of allItems ?? []) {
        const item = row as { line_total: number; meters: number; fabric_variant?: FabricVariantEmbed | null };
        const fv = item.fabric_variant;
        const cat = fv?.design?.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + item.line_total;

        const color = fv?.color || 'Unknown';
        if (!colorMap[color]) colorMap[color] = { meters: 0, revenue: 0 };
        colorMap[color].meters += item.meters;
        colorMap[color].revenue += item.line_total;
      }

      categoryRevenue = Object.entries(categoryMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: (value / (totalRevenue || 1)) * 100,
        }))
        .sort((a, b) => b.value - a.value);

      colorPopularity = Object.entries(colorMap)
        .map(([color, data]) => ({
          color,
          ...data,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const { data: monthlyInvoices } = await admin
      .from('invoices')
      .select(
        `
        grand_total,
        created_at,
        items:invoice_items(
          meters,
          line_total,
          fabric_variant:fabric_variants(purchase_price_per_meter)
        )
      `,
      )
      .eq('is_draft', false)
      .gte('created_at', sixMonthsAgo.toISOString());

    const profitTrendMap: Record<string, { revenue: number; cost: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toLocaleString('default', { month: 'short' });
      profitTrendMap[m] = { revenue: 0, cost: 0 };
    }

    for (const inv of monthlyInvoices ?? []) {
      const row = inv as {
        grand_total: number;
        created_at: string;
        items?: MonthlyInvoiceItem[] | null;
      };
      const month = new Date(row.created_at).toLocaleString('default', { month: 'short' });
      if (profitTrendMap[month]) {
        profitTrendMap[month].revenue += row.grand_total;
        for (const item of row.items ?? []) {
          const fv = item.fabric_variant;
          const fvRow = Array.isArray(fv) ? fv[0] : fv;
          const purchase = fvRow?.purchase_price_per_meter ?? 0;
          profitTrendMap[month].cost += item.meters * purchase;
        }
      }
    }

    const revenueVsProfit = Object.entries(profitTrendMap).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.revenue - data.cost,
    }));

    const paymentGroups = new Map<string, { count: number; amount: number }>();
    for (const inv of invList) {
      const g = paymentGroups.get(inv.payment_status) ?? { count: 0, amount: 0 };
      g.count += 1;
      g.amount += inv.grand_total;
      paymentGroups.set(inv.payment_status, g);
    }
    const paymentStatus = [...paymentGroups.entries()].map(([status, g]) => ({
      status,
      count: g.count,
      amount: g.amount,
    }));

    const { data: allCustomerInvoices } = await admin
      .from('invoices')
      .select('customer_id')
      .eq('is_draft', false)
      .not('customer_id', 'is', null);

    const orderCountByCustomer = new Map<string, number>();
    for (const r of allCustomerInvoices ?? []) {
      const cid = r.customer_id as string;
      orderCountByCustomer.set(cid, (orderCountByCustomer.get(cid) ?? 0) + 1);
    }
    const repeatCustomersCount = [...orderCountByCustomer.values()].filter((c) => c > 1).length;
    const totalCustomersWithOrders = orderCountByCustomer.size;
    const customerRetention = {
      new: totalCustomersWithOrders - repeatCustomersCount,
      repeat: repeatCustomersCount,
      rate: (repeatCustomersCount / (totalCustomersWithOrders || 1)) * 100,
    };

    const monthlyList = (monthlyInvoices ?? []) as {
      grand_total: number;
      created_at: string;
      items?: unknown;
    }[];
    const seasonalTrends = revenueVsProfit.map((p) => ({
      month: p.period,
      revenue: p.revenue,
      orders: monthlyList.filter(
        (m) => new Date(m.created_at).toLocaleString('default', { month: 'short' }) === p.period,
      ).length,
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
        seasonalTrends,
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
