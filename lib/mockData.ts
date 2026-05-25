// Mock database with realistic fabric store data

export interface Fabric {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  supplier: string;
  description: string;
  color: string;
  width: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalPurchases: number;
  lastPurchase: string;
  orderCount: number;
}

export interface OrderItem {
  fabricId: string;
  fabricName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  suppliedFabrics: string[];
  totalOrders: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  inventoryValue: number;
  monthlyRevenue: number;
}

// Mock Fabrics
export const mockFabrics: Fabric[] = [
  {
    id: 'FAB001',
    name: 'Cotton Khadi',
    type: 'Cotton',
    price: 250,
    stock: 500,
    supplier: 'SUP001',
    description: 'Pure cotton khadi fabric',
    color: 'White',
    width: 45,
  },
  {
    id: 'FAB002',
    name: 'Silk Blend',
    type: 'Silk',
    price: 450,
    stock: 150,
    supplier: 'SUP002',
    description: 'High quality silk blend',
    color: 'Maroon',
    width: 50,
  },
  {
    id: 'FAB003',
    name: 'Wool Tweed',
    type: 'Wool',
    price: 380,
    stock: 200,
    supplier: 'SUP001',
    description: 'Traditional wool tweed',
    color: 'Brown',
    width: 55,
  },
  {
    id: 'FAB004',
    name: 'Linen Weave',
    type: 'Linen',
    price: 320,
    stock: 280,
    supplier: 'SUP003',
    description: 'Fine linen weave',
    color: 'Beige',
    width: 48,
  },
  {
    id: 'FAB005',
    name: 'Cotton Jersey',
    type: 'Cotton',
    price: 180,
    stock: 50,
    supplier: 'SUP001',
    description: 'Soft cotton jersey knit',
    color: 'Navy',
    width: 60,
  },
  {
    id: 'FAB006',
    name: 'Polyester Satin',
    type: 'Polyester',
    price: 200,
    stock: 400,
    supplier: 'SUP004',
    description: 'Glossy polyester satin',
    color: 'Red',
    width: 45,
  },
  {
    id: 'FAB007',
    name: 'Georgette',
    type: 'Silk',
    price: 520,
    stock: 120,
    supplier: 'SUP002',
    description: 'Lightweight georgette',
    color: 'Purple',
    width: 48,
  },
  {
    id: 'FAB008',
    name: 'Denim',
    type: 'Cotton',
    price: 290,
    stock: 350,
    supplier: 'SUP001',
    description: 'Premium quality denim',
    color: 'Dark Blue',
    width: 58,
  },
  {
    id: 'FAB009',
    name: 'Velvet',
    type: 'Cotton Blend',
    price: 420,
    stock: 80,
    supplier: 'SUP003',
    description: 'Soft plush velvet',
    color: 'Green',
    width: 50,
  },
  {
    id: 'FAB010',
    name: 'Canvas',
    type: 'Cotton',
    price: 160,
    stock: 600,
    supplier: 'SUP004',
    description: 'Heavy duty canvas',
    color: 'Khaki',
    width: 60,
  },
  {
    id: 'FAB011',
    name: 'Chiffon',
    type: 'Silk',
    price: 380,
    stock: 200,
    supplier: 'SUP002',
    description: 'Transparent chiffon',
    color: 'Pink',
    width: 45,
  },
  {
    id: 'FAB012',
    name: 'Wool Felt',
    type: 'Wool',
    price: 340,
    stock: 100,
    supplier: 'SUP005',
    description: 'Thick wool felt',
    color: 'Gray',
    width: 54,
  },
  {
    id: 'FAB013',
    name: 'Muslin',
    type: 'Cotton',
    price: 220,
    stock: 450,
    supplier: 'SUP001',
    description: 'Fine muslin cloth',
    color: 'Off-white',
    width: 45,
  },
  {
    id: 'FAB014',
    name: 'Sateen',
    type: 'Cotton',
    price: 350,
    stock: 180,
    supplier: 'SUP003',
    description: 'Lustrous sateen finish',
    color: 'Black',
    width: 48,
  },
  {
    id: 'FAB015',
    name: 'Wool Crepe',
    type: 'Wool',
    price: 410,
    stock: 120,
    supplier: 'SUP005',
    description: 'Textured wool crepe',
    color: 'Charcoal',
    width: 52,
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'CUST001',
    name: 'Rajesh Patel',
    email: 'rajesh@example.com',
    phone: '+91-98765-43210',
    address: 'Plot 123, Textile Market',
    city: 'Ahmedabad',
    totalPurchases: 45000,
    lastPurchase: '2024-04-10',
    orderCount: 12,
  },
  {
    id: 'CUST002',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91-98765-43211',
    address: 'Garment Complex, Block B',
    city: 'Delhi',
    totalPurchases: 32000,
    lastPurchase: '2024-04-12',
    orderCount: 8,
  },
  {
    id: 'CUST003',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '+91-98765-43212',
    address: 'Fashion Street',
    city: 'Mumbai',
    totalPurchases: 58000,
    lastPurchase: '2024-04-08',
    orderCount: 15,
  },
  {
    id: 'CUST004',
    name: 'Anjali Verma',
    email: 'anjali@example.com',
    phone: '+91-98765-43213',
    address: 'Industrial Area',
    city: 'Bangalore',
    totalPurchases: 28000,
    lastPurchase: '2024-04-05',
    orderCount: 7,
  },
  {
    id: 'CUST005',
    name: 'Harsha Kumar',
    email: 'harsha@example.com',
    phone: '+91-98765-43214',
    address: 'Textile Hub',
    city: 'Surat',
    totalPurchases: 72000,
    lastPurchase: '2024-04-14',
    orderCount: 18,
  },
  {
    id: 'CUST006',
    name: 'Deepak Joshi',
    email: 'deepak@example.com',
    phone: '+91-98765-43215',
    address: 'Fashion District',
    city: 'Pune',
    totalPurchases: 35000,
    lastPurchase: '2024-04-11',
    orderCount: 9,
  },
  {
    id: 'CUST007',
    name: 'Meera Reddy',
    email: 'meera@example.com',
    phone: '+91-98765-43216',
    address: 'Apparel Market',
    city: 'Hyderabad',
    totalPurchases: 42000,
    lastPurchase: '2024-04-13',
    orderCount: 11,
  },
  {
    id: 'CUST008',
    name: 'Rohit Desai',
    email: 'rohit@example.com',
    phone: '+91-98765-43217',
    address: 'Garment Lane',
    city: 'Kolkata',
    totalPurchases: 25000,
    lastPurchase: '2024-04-06',
    orderCount: 6,
  },
  {
    id: 'CUST009',
    name: 'Sneha Gupta',
    email: 'sneha@example.com',
    phone: '+91-98765-43218',
    address: 'Textile Plaza',
    city: 'Chennai',
    totalPurchases: 55000,
    lastPurchase: '2024-04-15',
    orderCount: 14,
  },
  {
    id: 'CUST010',
    name: 'Arjun Malhotra',
    email: 'arjun@example.com',
    phone: '+91-98765-43219',
    address: 'Fashion Court',
    city: 'Jaipur',
    totalPurchases: 38000,
    lastPurchase: '2024-04-09',
    orderCount: 10,
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerId: 'CUST001',
    customerName: 'Rajesh Patel',
    date: '2024-04-14',
    items: [
      {
        fabricId: 'FAB001',
        fabricName: 'Cotton Khadi',
        quantity: 50,
        price: 250,
        total: 12500,
      },
      {
        fabricId: 'FAB008',
        fabricName: 'Denim',
        quantity: 30,
        price: 290,
        total: 8700,
      },
    ],
    total: 21200,
    status: 'delivered',
    notes: 'Standard order',
  },
  {
    id: 'ORD002',
    customerId: 'CUST002',
    customerName: 'Priya Sharma',
    date: '2024-04-12',
    items: [
      {
        fabricId: 'FAB002',
        fabricName: 'Silk Blend',
        quantity: 20,
        price: 450,
        total: 9000,
      },
    ],
    total: 9000,
    status: 'shipped',
    notes: 'Urgent delivery',
  },
  {
    id: 'ORD003',
    customerId: 'CUST003',
    customerName: 'Vikram Singh',
    date: '2024-04-13',
    items: [
      {
        fabricId: 'FAB007',
        fabricName: 'Georgette',
        quantity: 40,
        price: 520,
        total: 20800,
      },
      {
        fabricId: 'FAB011',
        fabricName: 'Chiffon',
        quantity: 25,
        price: 380,
        total: 9500,
      },
    ],
    total: 30300,
    status: 'confirmed',
    notes: 'Premium order',
  },
  {
    id: 'ORD004',
    customerId: 'CUST005',
    customerName: 'Harsha Kumar',
    date: '2024-04-15',
    items: [
      {
        fabricId: 'FAB010',
        fabricName: 'Canvas',
        quantity: 100,
        price: 160,
        total: 16000,
      },
    ],
    total: 16000,
    status: 'pending',
    notes: 'Bulk order',
  },
  {
    id: 'ORD005',
    customerId: 'CUST004',
    customerName: 'Anjali Verma',
    date: '2024-04-11',
    items: [
      {
        fabricId: 'FAB003',
        fabricName: 'Wool Tweed',
        quantity: 35,
        price: 380,
        total: 13300,
      },
    ],
    total: 13300,
    status: 'delivered',
    notes: 'Regular customer',
  },
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Cotton World',
    email: 'info@cottonworld.com',
    phone: '+91-99999-11111',
    address: 'Textile Mills, Zone A',
    city: 'Ahmedabad',
    suppliedFabrics: ['FAB001', 'FAB005', 'FAB008', 'FAB010', 'FAB013'],
    totalOrders: 85,
  },
  {
    id: 'SUP002',
    name: 'Silk Traditions',
    email: 'sales@silktrad.com',
    phone: '+91-99999-22222',
    address: 'Silk Complex',
    city: 'Bangalore',
    suppliedFabrics: ['FAB002', 'FAB007', 'FAB011'],
    totalOrders: 42,
  },
  {
    id: 'SUP003',
    name: 'Fine Weaves Ltd',
    email: 'contact@fineweaves.com',
    phone: '+91-99999-33333',
    address: 'Industrial Estate',
    city: 'Surat',
    suppliedFabrics: ['FAB004', 'FAB009', 'FAB014'],
    totalOrders: 58,
  },
  {
    id: 'SUP004',
    name: 'Poly Textiles',
    email: 'sales@polytex.com',
    phone: '+91-99999-44444',
    address: 'Polyester Park',
    city: 'Delhi',
    suppliedFabrics: ['FAB006', 'FAB010'],
    totalOrders: 72,
  },
  {
    id: 'SUP005',
    name: 'Wool Enterprises',
    email: 'info@woolent.com',
    phone: '+91-99999-55555',
    address: 'Wool Processing Unit',
    city: 'Himachal Pradesh',
    suppliedFabrics: ['FAB012', 'FAB015'],
    totalOrders: 35,
  },
];

// Dashboard metrics calculation
export const calculateMetrics = (): DashboardMetrics => {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const inventoryValue = mockFabrics.reduce(
    (sum, fabric) => sum + fabric.price * fabric.stock,
    0
  );
  const monthlyRevenue = mockOrders
    .filter((order) => {
      const orderDate = new Date(order.date);
      const now = new Date();
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, order) => sum + order.total, 0);

  return {
    totalRevenue,
    totalOrders: mockOrders.length,
    totalCustomers: mockCustomers.length,
    inventoryValue,
    monthlyRevenue,
  };
};
