import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { data: metrics, isLoading: loading, error } = useQuery({
    queryKey: ['dashboardMetrics', range],
    queryFn: () => api.dashboardApi.getMetrics(range),
  });

  return { 
    metrics: metrics || null, 
    loading, 
    error: error instanceof Error ? error.message : null 
  };
}

// Hook for inventory data
export function useInventoryData(searchTerm?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['inventory', searchTerm],
    queryFn: () => api.inventoryApi.getFabrics(searchTerm),
  });

  const fabrics = data?.fabrics || [];

  const addMutation = useMutation({
    mutationFn: (fabric: unknown) => api.inventoryApi.addFabric(fabric),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: unknown }) => api.inventoryApi.updateFabric(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.inventoryApi.deleteFabric(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  return {
    fabrics,
    loading,
    error: error instanceof Error ? error.message : null,
    addFabric: (fabric: unknown) => addMutation.mutateAsync(fabric),
    updateFabric: (id: string, updates: unknown) => updateMutation.mutateAsync({ id, updates }),
    deleteFabric: async (id: string): Promise<void> => { await deleteMutation.mutateAsync(id) },
  };
}

// Hook for sales data
export function useSalesData(filterStatus?: string, includeDraft = true) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['orders', filterStatus, includeDraft],
    queryFn: () => api.salesApi.getOrders(filterStatus, includeDraft),
  });

  const orders = data?.orders || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.salesApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (order: CounterOrderRequest) => api.salesApi.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order }: { id: string; order: CounterOrderRequest }) => api.salesApi.updateOrder(id, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => api.salesApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });

  const getCustomerByPhone = async (phone: string): Promise<CustomerQuickInfo | null> => {
    // Proactively fetch and let queryClient cache if we want, or just return directly.
    return api.customersApi.getCustomerByPhone(phone);
  };

  const getOrderById = async (id: string): Promise<InvoiceDetail> => {
    // Fetch directly, though we could use queryClient.fetchQuery here
    return api.salesApi.getOrderById(id);
  };

  return {
    orders,
    loading,
    error: error instanceof Error ? error.message : null,
    updateOrderStatus: (id: string, status: string) => updateStatusMutation.mutateAsync({ id, status }),
    createOrder: (order: CounterOrderRequest) => createOrderMutation.mutateAsync(order),
    updateOrder: (id: string, order: CounterOrderRequest) => updateOrderMutation.mutateAsync({ id, order }),
    deleteOrder: async (id: string): Promise<void> => { await deleteOrderMutation.mutateAsync(id) },
    getCustomerByPhone,
    getOrderById,
  };
}

// Hook for customers data
export function useCustomersData(searchTerm?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => api.customersApi.getCustomers(searchTerm),
  });

  const customers = data?.customers || [];

  const addMutation = useMutation({
    mutationFn: (customer: unknown) => api.customersApi.addCustomer(customer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: unknown }) => api.customersApi.updateCustomer(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  return {
    customers,
    loading,
    error: error instanceof Error ? error.message : null,
    addCustomer: (customer: unknown) => addMutation.mutateAsync(customer),
    updateCustomer: (id: string, updates: unknown) => updateMutation.mutateAsync({ id, updates }),
  };
}

// Hook for suppliers data
export function useSuppliersData(searchTerm?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: () => api.suppliersApi.getSuppliers(searchTerm),
  });

  const suppliers = data?.suppliers || [];

  const addMutation = useMutation({
    mutationFn: (supplier: Omit<SupplierRow, 'id' | 'createdAt'>) => api.suppliersApi.addSupplier(supplier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: unknown }) => api.suppliersApi.updateSupplier(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });

  return {
    suppliers,
    loading,
    error: error instanceof Error ? error.message : null,
    addSupplier: (supplier: Omit<SupplierRow, 'id' | 'createdAt'>) => addMutation.mutateAsync(supplier),
    updateSupplier: (id: string, updates: unknown) => updateMutation.mutateAsync({ id, updates }),
  };
}
