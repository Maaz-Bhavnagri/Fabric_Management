// User and Workspace Types
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  gstin?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'manager' | 'staff';
  createdAt: Date;
}

// Fabric/Product Types
export interface Fabric {
  id: string;
  workspaceId: string;
  name: string;
  sku: string;
  type: string;
  color: string;
  price: number;
  costPrice: number;
  quantity: number;
  minStockLevel: number;
  description?: string;
  imageUrl?: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  gstin?: string;
  creditLimit: number;
  creditUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Types
export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  gstin?: string;
  paymentTerms?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface Order {
  id: string;
  workspaceId: string;
  customerId: string;
  orderNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  fabricId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// JWT Types
export interface JWTPayload {
  userId: string;
  workspaceId: string;
  role: string;
  iat: number;
  exp: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
