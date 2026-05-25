import { useState, useEffect } from 'react';
import * as api from '@/lib/api-client';
import type {
  CounterOrderRequest,
  DashboardMetrics,
  InvoiceDetail,
  InventoryRow,
  CustomerRow,
  CustomerQuickInfo,
  SupplierRow,
  InvoiceRow,
} from '@/lib/app-types';

// Hook for dashboard data
export function useDashboardData(range = '30d') {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.dashboardApi.getMetrics(range);
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range]);

  return { metrics, loading, error };
}

// Hook for inventory data
export function useInventoryData(searchTerm?: string) {
  const [fabrics, setFabrics] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.inventoryApi.getFabrics(searchTerm);
        setFabrics(data.fabrics || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm]);

  const addFabric = async (fabric: unknown) => {
    try {
      const newFabric = await api.inventoryApi.addFabric(fabric);
      setFabrics([...fabrics, newFabric]);
      return newFabric;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add fabric');
    }
  };

  const updateFabric = async (id: string, updates: unknown) => {
    try {
      const updated = await api.inventoryApi.updateFabric(id, updates);
      setFabrics(fabrics.map((f) => (f.id === id ? updated : f)));
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update fabric');
    }
  };

  const deleteFabric = async (id: string) => {
    try {
      await api.inventoryApi.deleteFabric(id);
      setFabrics(fabrics.filter((f) => f.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete fabric');
    }
  };

  return { fabrics, loading, error, addFabric, updateFabric, deleteFabric };
}

// Hook for sales data
export function useSalesData(filterStatus?: string, includeDraft = true) {
  const [orders, setOrders] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.salesApi.getOrders(filterStatus, includeDraft);
        setOrders(data.orders || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterStatus, includeDraft]);

  const updateOrderStatus = async (
    id: string,
    status: string
  ) => {
    try {
      const updated = await api.salesApi.updateOrderStatus(id, status);
      setOrders(orders.map((o) => (o.id === id ? updated : o)));
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update order');
    }
  };

  const createOrder = async (order: CounterOrderRequest): Promise<unknown> => {
    try {
      const newOrder = await api.salesApi.createOrder(order);
      setOrders([newOrder, ...orders]);
      return newOrder;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create order');
    }
  };

  const updateOrder = async (id: string, order: CounterOrderRequest): Promise<unknown> => {
    try {
      const updated = await api.salesApi.updateOrder(id, order);
      setOrders(orders.map(o => o.id === id ? updated : o));
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update order');
    }
  };

  const getCustomerByPhone = async (phone: string): Promise<CustomerQuickInfo | null> => {
    return api.customersApi.getCustomerByPhone(phone);
  };

  const getOrderById = async (id: string): Promise<InvoiceDetail> => {
    return api.salesApi.getOrderById(id);
  };

  const deleteOrder = async (id: string): Promise<void> => {
    try {
      await api.salesApi.deleteOrder(id);
      setOrders(orders.filter((o) => o.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete order');
    }
  };

  return { orders, loading, error, updateOrderStatus, createOrder, updateOrder, deleteOrder, getCustomerByPhone, getOrderById };
}

// Hook for customers data
export function useCustomersData(searchTerm?: string) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.customersApi.getCustomers(searchTerm);
        setCustomers(data.customers || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm]);

  const addCustomer = async (customer: unknown) => {
    try {
      const newCustomer = await api.customersApi.addCustomer(customer);
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add customer');
    }
  };

  const updateCustomer = async (id: string, updates: unknown) => {
    try {
      const updated = await api.customersApi.updateCustomer(id, updates);
      setCustomers(customers.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update customer');
    }
  };

  return { customers, loading, error, addCustomer, updateCustomer };
}

// Hook for suppliers data
export function useSuppliersData(searchTerm?: string) {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.suppliersApi.getSuppliers(searchTerm);
        setSuppliers(data.suppliers || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm]);

  const addSupplier = async (supplier: Omit<SupplierRow, 'id' | 'createdAt'>) => {
    try {
      const newSupplier = await api.suppliersApi.addSupplier(supplier);
      setSuppliers([...suppliers, newSupplier]);
      return newSupplier;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add supplier');
    }
  };

  const updateSupplier = async (id: string, updates: unknown) => {
    try {
      const updated = await api.suppliersApi.updateSupplier(id, updates);
      setSuppliers(suppliers.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update supplier');
    }
  };

  return { suppliers, loading, error, addSupplier, updateSupplier };
}
