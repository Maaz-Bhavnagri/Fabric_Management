# KapadMitra Backend API Documentation

## Overview

KapadMitra now includes a complete production-ready backend built with Next.js API routes, SQLite/PostgreSQL database, and JWT authentication. The backend is fully integrated with the frontend and provides all functionality for managing fabric inventory, orders, customers, and suppliers.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (API Routes)
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Validation**: Zod
- **ORM**: Raw SQL queries for maximum control

### Project Structure

```
app/
  ├── api/
  │   ├── auth/              # Authentication endpoints
  │   │   └── route.ts       # Register, Login, Refresh Token
  │   ├── dashboard/
  │   │   └── metrics/       # Dashboard analytics
  │   │       └── route.ts
  │   ├── inventory/         # Fabric management
  │   │   └── route.ts
  │   ├── orders/            # Sales order management
  │   │   └── route.ts
  │   ├── customers/         # Customer management
  │   │   └── route.ts
  │   ├── suppliers/         # Supplier management
  │   │   └── route.ts
  │   └── init/              # Data initialization
  │       └── route.ts
lib/
  ├── db.ts                  # Database connection & queries
  ├── db-types.ts            # TypeScript interfaces
  ├── db-schema.sql          # Database schema
  ├── auth-utils.ts          # JWT & password utilities
  └── api-client.ts          # Frontend API wrapper
```

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user and create a workspace.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "workspaceName": "My Fabric Store"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt.token.here",
    "refreshToken": "refresh.token.here",
    "user": {
      "id": "user_xxx",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "workspace": {
      "id": "ws_xxx",
      "name": "My Fabric Store"
    }
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** (Same as register)

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh.token.here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new.jwt.token"
  }
}
```

### Inventory Management

#### GET `/api/inventory`
List all fabrics with pagination and search.

**Query Parameters:**
- `search` (optional): Search by name, SKU, or color
- `limit` (optional, default=50): Number of results
- `offset` (optional, default=0): Pagination offset
- `id` (optional): Get single fabric by ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fab_xxx",
      "name": "Cotton Saree",
      "sku": "SKU-001",
      "type": "Saree",
      "color": "Red",
      "price": 1500,
      "costPrice": 800,
      "quantity": 25,
      "minStockLevel": 10
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

#### POST `/api/inventory`
Create a new fabric.

**Request Body:**
```json
{
  "name": "Cotton Saree",
  "sku": "SKU-001",
  "type": "Saree",
  "color": "Red",
  "price": 1500,
  "costPrice": 800,
  "quantity": 25,
  "minStockLevel": 10,
  "description": "Premium cotton saree",
  "imageUrl": "https://..."
}
```

#### PUT `/api/inventory?id=fab_xxx`
Update a fabric.

**Request Body:** (Any subset of create fields)

#### DELETE `/api/inventory?id=fab_xxx`
Delete a fabric.

### Orders Management

#### GET `/api/orders`
List all orders with pagination and filtering.

**Query Parameters:**
- `search` (optional): Search by order number or customer name
- `status` (optional): Filter by status (pending, confirmed, shipped, delivered, cancelled)
- `limit` (optional, default=50)
- `offset` (optional, default=0)
- `id` (optional): Get single order by ID

#### POST `/api/orders`
Create a new order.

**Request Body:**
```json
{
  "customerId": "cust_xxx",
  "items": [
    {
      "fabricId": "fab_xxx",
      "quantity": 5,
      "unitPrice": 1500
    }
  ],
  "taxAmount": 500,
  "discountAmount": 200,
  "notes": "Urgent delivery",
  "status": "pending"
}
```

#### PUT `/api/orders?id=ord_xxx`
Update order status and delivery date.

**Request Body:**
```json
{
  "status": "delivered",
  "deliveryDate": "2024-04-20"
}
```

#### DELETE `/api/orders?id=ord_xxx`
Delete an order and restore inventory if not delivered.

### Customers Management

#### GET `/api/customers`
List all customers with search.

**Query Parameters:**
- `search` (optional): Search by name, email, or phone
- `limit` (optional, default=50)
- `offset` (optional, default=0)
- `id` (optional): Get single customer by ID

#### POST `/api/customers`
Create a new customer.

**Request Body:**
```json
{
  "name": "Rajesh Patel",
  "email": "rajesh@example.com",
  "phone": "98765-43210",
  "address": "123 Main St",
  "city": "Ahmedabad",
  "gstin": "27ABCDE1234F1Z5",
  "creditLimit": 50000
}
```

#### PUT `/api/customers?id=cust_xxx`
Update customer details.

#### DELETE `/api/customers?id=cust_xxx`
Delete a customer.

### Suppliers Management

#### GET `/api/suppliers`
List all suppliers with search.

#### POST `/api/suppliers`
Create a new supplier.

**Request Body:**
```json
{
  "name": "Textile Mills Ltd",
  "email": "mills@example.com",
  "phone": "99999-11111",
  "address": "456 Industrial Zone",
  "city": "Surat",
  "gstin": "27ABCDE1234F1Z5",
  "paymentTerms": "Net 30"
}
```

#### PUT `/api/suppliers?id=supp_xxx`
Update supplier details.

#### DELETE `/api/suppliers?id=supp_xxx`
Delete a supplier.

### Dashboard

#### GET `/api/dashboard/metrics`
Get dashboard analytics and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "fabricsCount": 20,
    "lowStockCount": 3,
    "ordersCount": 150,
    "customersCount": 25,
    "totalRevenue": 500000,
    "pendingOrders": 5,
    "revenueTrend": [
      {"date": "2024-04-15", "amount": 50000},
      {"date": "2024-04-16", "amount": 65000}
    ],
    "recentOrders": [...]
  }
}
```

### Initialization

#### POST `/api/init`
Initialize workspace with demo data (fabrics, customers, suppliers).

Only creates demo data if workspace is empty.

## Authentication

All API endpoints (except auth) require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are returned from login/register endpoints and stored in `localStorage`.

## Database Schema

### Core Tables

- **users**: User accounts with encrypted passwords
- **workspaces**: Business accounts (one per owner)
- **workspace_users**: Multi-user access control
- **fabrics**: Inventory of fabrics/products
- **customers**: Customer information with credit limits
- **suppliers**: Supplier information
- **orders**: Sales orders
- **order_items**: Individual items in orders
- **stock_transactions**: Audit trail for inventory changes

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `409`: Conflict (duplicate SKU, etc.)
- `500`: Server Error

## Deployment

### Environment Variables

Set these for production:

```
JWT_SECRET=your-secret-key-here (auto-generated for dev)
DATABASE_URL=postgresql://user:password@host/kapad_mitra (for PostgreSQL)
NODE_ENV=production
```

### Database Migration

For PostgreSQL production:

1. Update `lib/db.ts` to use PostgreSQL driver
2. Run schema from `lib/db-schema.sql` against PostgreSQL
3. Update connection string in environment

### Security Considerations

- JWT tokens expire after 7 days
- Refresh tokens expire after 30 days
- Passwords are hashed with bcryptjs (10 rounds)
- All sensitive queries filter by workspace_id
- SQL injection prevention via parameterized queries
- CORS should be configured in production

## Development

### Local Testing

1. Start the dev server: `pnpm dev`
2. Use Postman/Insomnia to test endpoints
3. Auth endpoints don't require token
4. Other endpoints require JWT token from login

### Database Inspection

SQLite database is stored in `.data/kapad-mitra.db`:

```bash
sqlite3 .data/kapad-mitra.db
sqlite> SELECT * FROM users;
```

## Frontend Integration

The frontend (`lib/api-client.ts`) already includes all API methods:

```typescript
// Login
await authApi.login('user@example.com', 'password');

// Get fabrics
const { fabrics, total } = await inventoryApi.getFabrics(search, limit, offset);

// Create order
await salesApi.createOrder({ customerId, items, taxAmount, discountAmount });
```

All methods automatically include JWT token in Authorization header.
