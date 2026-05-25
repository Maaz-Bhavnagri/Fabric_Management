-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces (one per fabric store owner)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gstin TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workspace users (for multi-user workspaces)
CREATE TABLE IF NOT EXISTS workspace_users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('owner', 'manager', 'staff')) DEFAULT 'staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, user_id)
);

-- Fabrics/Products inventory
CREATE TABLE IF NOT EXISTS fabrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  price REAL NOT NULL,
  cost_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  description TEXT,
  image_url TEXT,
  supplier_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  UNIQUE(workspace_id, sku)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  gstin TEXT,
  credit_limit REAL DEFAULT 0,
  credit_used REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  gstin TEXT,
  payment_terms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  total_amount REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  status TEXT CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivery_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  UNIQUE(workspace_id, order_number)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id TEXT NOT NULL,
  fabric_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (fabric_id) REFERENCES fabrics(id)
);

-- Stock Transactions (for audit trail)
CREATE TABLE IF NOT EXISTS stock_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL,
  fabric_id TEXT NOT NULL,
  transaction_type TEXT CHECK(transaction_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (fabric_id) REFERENCES fabrics(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_workspace_id ON workspace_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_user_id ON workspace_users(user_id);
CREATE INDEX IF NOT EXISTS idx_fabrics_workspace_id ON fabrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_workspace_id ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_id ON suppliers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_workspace_id ON orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
