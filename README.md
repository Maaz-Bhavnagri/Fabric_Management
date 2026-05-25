# KapadMitra - Fabric Store Management System

A complete, production-ready SaaS application for managing fabric store operations including inventory, orders, customers, and suppliers. Built with Next.js 16, SQLite/PostgreSQL, and React.

## Features

### Core Functionality
- **Inventory Management**: Track fabrics with real-time stock levels, pricing, and SKU management
- **Order Management**: Create, process, and track sales orders with automatic inventory deduction
- **Customer Management**: Maintain customer database with credit limits and purchase history
- **Supplier Management**: Track suppliers and their payment terms
- **Dashboard Analytics**: Real-time metrics on revenue, orders, inventory, and customer activity
- **Multi-user Support**: One workspace per business owner with staff member access control

### Technical Features
- **Multi-tenant Architecture**: Fully isolated workspaces for each business
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-based Access**: Owner, Manager, and Staff roles (extensible)
- **Responsive Design**: Mobile-first UI that works on all devices
- **Multilingual**: Support for English, Gujarati, and Hindi
- **Dark Theme**: Professional dark UI with proper contrast and accessibility

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd kapad-mitra
pnpm install
```

### Running Locally

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### First Steps

1. **Landing Page**: Visit the home page to see the app overview
2. **Register**: Click "Get Started" and create a new account
3. **Create Account**: Provide your name, email, password, and store name
4. **Dashboard**: After login, you'll see the dashboard with initialization button
5. **Initialize**: Click "Initialize Demo Data" to seed your workspace with sample data
6. **Explore**: Navigate through all pages to explore the full functionality

### Test Credentials

After registration, use any valid email and password (min 6 chars):
- Email: `test@example.com`
- Password: `password123`

## Architecture Overview

### Frontend Structure
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: React Context (Auth, Language)
- **Data Fetching**: Custom hooks with real API integration
- **Components**: Reusable, modular component architecture

### Backend Structure
- **API Routes**: Next.js `/app/api` routes
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT with bcryptjs password hashing
- **Validation**: Zod schemas for input validation
- **Multi-tenancy**: Workspace-based data isolation

### Database
- **SQLite**: Included for local development in `.data/kapad-mitra.db`
- **PostgreSQL**: Ready for production deployment
- **Schema**: 9 core tables with relationships and indexes
- **Audit Trail**: Stock transaction tracking

## Project Structure

```
.
├── app/
│   ├── (app)/                 # Protected authenticated pages
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── reports/
│   │   ├── profile/
│   │   └── settings/
│   ├── api/                   # API endpoints
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── dashboard/
│   │   └── init/
│   ├── auth/                  # Auth pages
│   ├── layout.tsx
│   └── page.tsx               # Landing page
├── components/
│   ├── layout/                # Layout components
│   ├── dashboard/             # Dashboard components
│   ├── inventory/             # Inventory features
│   ├── sales/                 # Sales features
│   ├── customers/             # Customer features
│   ├── suppliers/             # Supplier features
│   └── ui/                    # shadcn/ui components
├── context/                   # React Context
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── hooks/                     # Custom hooks
│   └── useData.ts
├── lib/
│   ├── api-client.ts          # Frontend API wrapper
│   ├── auth-utils.ts          # JWT utilities
│   ├── db.ts                  # Database client
│   ├── db-types.ts            # TypeScript types
│   ├── db-schema.sql          # Database schema
│   ├── translations.ts        # i18n translations
│   ├── mockData.ts            # Legacy mock data
│   └── utils.ts
├── .data/                     # SQLite database (local)
├── BACKEND_API.md             # API documentation
├── README_KAPAD_MITRA.md      # User guide
└── package.json
```

## API Documentation

See `BACKEND_API.md` for complete API documentation including:
- Authentication endpoints
- CRUD operations for all entities
- Query parameters and pagination
- Error handling
- Database schema

Quick reference:

```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login
GET    /api/inventory               # List fabrics
POST   /api/inventory               # Create fabric
PUT    /api/inventory?id=xxx        # Update fabric
DELETE /api/inventory?id=xxx        # Delete fabric
GET    /api/orders                  # List orders
POST   /api/orders                  # Create order
GET    /api/customers               # List customers
POST   /api/customers               # Create customer
GET    /api/suppliers               # List suppliers
POST   /api/suppliers               # Create supplier
GET    /api/dashboard/metrics       # Get analytics
```

## Configuration

### Environment Variables

Create a `.env.local` file for local development (optional, has defaults):

```env
# JWT Secret (auto-generated if not provided)
JWT_SECRET=your-secret-key-here

# Database (optional, uses SQLite by default)
DATABASE_URL=postgresql://user:password@localhost/kapad_mitra

# Environment
NODE_ENV=development
```

### Language Settings

Users can change language in Settings page:
- English (default)
- Gujarati
- Hindi

All UI text is translated and stored in `lib/translations.ts`

## Features by Page

### Dashboard
- Key metrics (fabrics, orders, customers, revenue)
- Revenue trend chart (7-day)
- Recent orders list
- Quick stats cards

### Inventory
- Search and filter fabrics
- Real-time stock levels
- Add/Edit/Delete fabrics
- Low stock alerts
- SKU management

### Sales
- Create orders with multiple items
- Track order status (pending, confirmed, shipped, delivered)
- Automatic inventory deduction
- Order notes and tracking

### Customers
- Maintain customer database
- Credit limit management
- Contact information
- Purchase history

### Suppliers
- Manage suppliers
- Payment terms tracking
- Contact information
- Supplier for each fabric

### Reports
- Analytics and insights
- Coming soon: Advanced reports

### Profile
- Update account information
- Change password
- Personal details

### Settings
- Language selection
- Currency format
- Tax rate configuration
- Notification preferences

## Security

- **Passwords**: Hashed with bcryptjs (10 rounds)
- **Tokens**: JWT with 7-day expiration, refresh tokens with 30-day expiration
- **Database**: All queries are parameterized to prevent SQL injection
- **Workspace Isolation**: Data filtered by workspace_id on all queries
- **CORS**: Configure appropriately for production
- **HTTPS**: Required in production

## Performance

- **Caching**: Frontend API client with efficient request handling
- **Pagination**: All list endpoints support limit/offset pagination
- **Indexes**: Database indexes on frequently queried columns
- **Code Splitting**: Next.js automatic code splitting per route
- **Responsive**: Mobile-optimized UI with fast load times

## Development Workflow

### Adding a New Feature

1. **Backend API**: Create route in `/app/api/`
2. **Database Schema**: Update `lib/db-schema.sql` if needed
3. **Types**: Add types to `lib/db-types.ts`
4. **Frontend Client**: Add method to `lib/api-client.ts`
5. **Frontend Page**: Create page in `/app/(app)/feature/`
6. **Components**: Build reusable components in `/components/feature/`

### Database Changes

1. Update `lib/db-schema.sql`
2. Recreate database: Delete `.data/kapad-mitra.db`
3. Dev server will reinitialize on startup

### Customization

- **Colors**: Edit `app/globals.css` theme variables
- **Fonts**: Modify `app/layout.tsx` and `globals.css`
- **Translations**: Add new languages in `lib/translations.ts`
- **API Logic**: Extend API routes as needed

## Deployment

### Vercel (Recommended)

```bash
git push origin main
# Deploys automatically
```

Set environment variables in Vercel Project Settings.

### Self-hosted

1. Build: `pnpm build`
2. Deploy built files to your server
3. Set environment variables
4. Use PostgreSQL for production database
5. Configure CORS for your domain

## Troubleshooting

### "Database not initialized" error
- Ensure `.data` directory exists
- Check file permissions
- Try deleting `.data/kapad-mitra.db` to reinitialize

### Token expired errors
- Clear localStorage and login again
- Check JWT_SECRET matches across restarts

### CORS errors
- Check API client Authorization header
- Verify token is stored correctly in localStorage

### Compilation errors
- Run `pnpm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next` folders, then reinstall

## Support & Documentation

- **API Docs**: See `BACKEND_API.md`
- **User Guide**: See `README_KAPAD_MITRA.md`
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@kapadmitra.com

## License

This project is provided as-is for business use.

## Roadmap

- Advanced reporting and analytics
- Inventory forecasting
- Automated purchase orders
- Multi-warehouse support
- Mobile app (iOS/Android)
- Payment gateway integration
- Email notifications
- Invoice generation
- GST/Tax management
- Customer portal

---

Built with ❤️ for textile businesses in India.
