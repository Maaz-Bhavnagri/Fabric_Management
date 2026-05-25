// Real backend API client for KapadMitra

import type {
  CounterOrderRequest,
  CustomerRow,
  CustomerQuickInfo,
  DashboardMetrics,
  InvoiceDetail,
  InventoryRow,
  InvoiceRow,
  SupplierRow,
} from '@/lib/app-types';
import { toPublicErrorMessage } from '@/lib/api-errors';

const API_URL = '/api';

// Helper to make requests using Supabase session cookies (same-origin).
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
};

// Dashboard APIs
export const dashboardApi = {
  getMetrics: async (range = '30d'): Promise<DashboardMetrics> => {
    const response = await makeRequest(`/dashboard/metrics?range=${range}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },
};

// Inventory APIs
export const inventoryApi = {
  getFabrics: async (
    searchTerm?: string,
    limit = 50,
    offset = 0
  ): Promise<{ fabrics: InventoryRow[]; total: number }> => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await makeRequest(`/inventory?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return { fabrics: data.data, total: data.total };
  },

  getFabricById: async (id: string): Promise<InventoryRow> => {
    const response = await makeRequest(`/inventory?id=${id}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  addFabric: async (fabric: unknown): Promise<InventoryRow> => {
    const response = await makeRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(fabric),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  updateFabric: async (id: string, updates: unknown): Promise<InventoryRow> => {
    const response = await makeRequest(`/inventory?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  deleteFabric: async (id: string) => {
    const response = await makeRequest(`/inventory?id=${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return true;
  },
};

// Sales APIs
export const salesApi = {
  getOrders: async (
    status?: string,
    includeDraft = false,
    limit = 50,
    offset = 0
  ): Promise<{ orders: InvoiceRow[]; total: number }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (includeDraft) params.append('includeDraft', 'true');
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await makeRequest(`/orders?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return { orders: data.data, total: data.total };
  },

  getOrderById: async (id: string): Promise<InvoiceDetail> => {
    const response = await makeRequest(`/orders?id=${id}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  createOrder: async (order: CounterOrderRequest): Promise<InvoiceRow> => {
    const response = await makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  updateOrder: async (id: string, order: CounterOrderRequest): Promise<InvoiceRow> => {
    const response = await makeRequest(`/orders?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<InvoiceRow> => {
    const response = await makeRequest(`/orders?id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus: status }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    const response = await makeRequest(`/orders?id=${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return true;
  },
};

// Customers APIs
export const customersApi = {
  getCustomers: async (
    searchTerm?: string,
    limit = 50,
    offset = 0
  ): Promise<{ customers: CustomerRow[]; total: number }> => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await makeRequest(`/customers?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return { customers: data.data, total: data.total };
  },

  getCustomerById: async (id: string): Promise<CustomerRow> => {
    const response = await makeRequest(`/customers?id=${id}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  getCustomerByPhone: async (phone: string): Promise<CustomerQuickInfo | null> => {
    const response = await makeRequest(`/customers?phone=${encodeURIComponent(phone)}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  addCustomer: async (customer: unknown): Promise<CustomerRow> => {
    const response = await makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  updateCustomer: async (id: string, updates: unknown): Promise<CustomerRow> => {
    const response = await makeRequest(`/customers?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },
};

// Suppliers APIs
export const suppliersApi = {
  getSuppliers: async (
    searchTerm?: string,
    limit = 50,
    offset = 0
  ): Promise<{ suppliers: SupplierRow[]; total: number }> => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await makeRequest(`/suppliers?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return { suppliers: data.data, total: data.total };
  },

  getSupplierById: async (id: string): Promise<SupplierRow> => {
    const response = await makeRequest(`/suppliers?id=${id}`);
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  addSupplier: async (supplier: unknown): Promise<SupplierRow> => {
    const response = await makeRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },

  updateSupplier: async (id: string, updates: unknown): Promise<SupplierRow> => {
    const response = await makeRequest(`/suppliers?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!data.success) throw new Error(toPublicErrorMessage(data.error));
    return data.data;
  },
};
