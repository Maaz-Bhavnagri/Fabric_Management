# KapadMitra Setup & Troubleshooting Guide

## Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (or npm/yarn)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd kapad-mitra

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## First Login

### Register New Account
1. Click "Get Started" on landing page
2. Fill in registration form:
   - **Name**: Your full name
   - **Email**: Valid email address
   - **Password**: At least 6 characters
   - **Store Name**: Your fabric store name
3. Click "Register"
4. Automatically logged in and redirected to dashboard

### Initialize Demo Data
After first login, you'll see an "Initialize Demo Data" button on the dashboard:
- Creates 5 sample fabrics
- Creates 3 sample customers
- Creates 2 sample suppliers
- Click once only (idempotent - won't duplicate if run multiple times)

### Explore Features
- **Dashboard**: View analytics and metrics
- **Inventory**: Manage fabric catalog
- **Sales**: Create and track orders
- **Customers**: Manage customer database
- **Suppliers**: Track suppliers
- **Settings**: Change language and preferences

## Development Guide

### Adding New Features

#### 1. Create Backend API
Create file: `app/api/[feature]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  await initializeDatabase();
  const auth = requireAuth(request);
  if (!auth.authenticated) return auth.error;
  
  const user = auth.user!;
  // Your logic here
  
  return NextResponse.json({ success: true, data: [] });
}
```

#### 2. Update Database Schema
Edit `lib/db-schema.sql` and add your table.

#### 3. Add TypeScript Types
Update `lib/db-types.ts` with new interfaces.

#### 4. Add Frontend API Client
Update `lib/api-client.ts` with API methods.

#### 5. Create Frontend Page
Create page file: `app/(app)/[feature]/page.tsx`

#### 6. Build Components
Create reusable components in `components/[feature]/`

### Code Organization

```
components/
  ├── ui/              # shadcn/ui components
  ├── layout/          # Layout components (Sidebar, Navbar)
  ├── dashboard/       # Dashboard feature
  ├── inventory/       # Inventory feature
  └── [feature]/       # Other features

lib/
  ├── db.ts            # Database client
  ├── db-types.ts      # TypeScript types
  ├── api-client.ts    # Frontend API calls
  ├── auth-utils.ts    # JWT utilities
  └── translations.ts  # i18n text

app/
  ├── api/
  │   ├── auth/        # Authentication
  │   ├── inventory/   # Inventory API
  │   └── [feature]/   # Feature APIs
  ├── (app)/           # Protected pages
  │   ├── dashboard/
  │   ├── inventory/
  │   └── [feature]/
  └── auth/            # Auth pages
```

## Troubleshooting

### "Database not initialized" Error

**Problem**: Getting database connection errors on startup.

**Solutions**:
1. Delete `.data/kapad-mitra.db` file
2. Restart dev server: `pnpm dev`
3. Database will be recreated automatically

### "Module not found" Error

**Problem**: Import errors for new dependencies.

**Solutions**:
```bash
# Reinstall dependencies
pnpm install

# Clear cache and rebuild
rm -rf node_modules .next
pnpm install
pnpm dev
```

### "Cannot find token" / "Unauthorized" Errors

**Problem**: API calls failing with 401 Unauthorized.

**Solutions**:
1. Clear browser localStorage: Dev Tools → Application → localStorage → Clear
2. Log out and log back in
3. Check AuthContext.tsx is storing token correctly
4. Verify JWT_SECRET is set (optional for dev, auto-generated)

### "Port 3000 already in use"

**Problem**: Dev server won't start on port 3000.

**Solutions**:
```bash
# Kill existing process (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

### Database Locked Error

**Problem**: "Database is locked" error when running multiple dev servers.

**Solutions**:
1. Ensure only one dev server is running
2. Close all database connections
3. Delete `.data/kapad-mitra.db` and restart

### CSS/Styling Issues

**Problem**: Styles not applying correctly.

**Solutions**:
```bash
# Rebuild Tailwind CSS
pnpm dev --turbo

# Clear Next.js cache
rm -rf .next
pnpm dev
```

### API Requests Failing

**Problem**: Frontend making API calls but getting errors.

**Solutions**:
1. Check DevTools Network tab for request details
2. Verify Authorization header is included
3. Check API route file exists in `app/api/`
4. Ensure database is initialized (`initializeDatabase()`)
5. Check error response in console

### Deployment Issues

#### Vercel Deployment
```bash
# Set environment variables in Vercel Dashboard:
JWT_SECRET=your-secret-here
DATABASE_URL=postgresql://... (for production)

# Push to GitHub
git push origin main
```

#### Self-Hosted
```bash
# Build
pnpm build

# Deploy built files in `.next` directory
# Set environment variables on server
# Use PostgreSQL database in production
```

## Environment Variables

### Development (Optional)
```env
# Auto-generated if not set
JWT_SECRET=dev-secret-key-change-in-production

# Optional - defaults to SQLite
DATABASE_URL=sqlite://.data/kapad-mitra.db
```

### Production (Required)
```env
JWT_SECRET=your-strong-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/kapad_mitra
NODE_ENV=production
```

## Common Questions

### Q: Can I change the database to PostgreSQL?

**A**: Yes! Update `lib/db.ts` to use PostgreSQL driver and set `DATABASE_URL` environment variable pointing to your PostgreSQL instance.

### Q: How do I backup my data?

**A**: 
- **SQLite**: Copy `.data/kapad-mitra.db` file
- **PostgreSQL**: Use `pg_dump` command

### Q: How do I reset all data?

**A**: Delete `.data/kapad-mitra.db` and restart dev server. Database will be recreated from schema.

### Q: Can multiple users share one workspace?

**A**: Yes, via workspace_users table. Owner can invite staff/managers. Currently UI not implemented but API supports it.

### Q: How do I add new languages?

**A**: 
1. Add translations to `lib/translations.ts`
2. Add language option in settings
3. Update LanguageContext.tsx

### Q: How do I export data?

**A**: Build API endpoint to export as JSON/CSV. Data stored in standard SQL tables - any export tool works.

## Performance Tips

1. **Use pagination** for large datasets (limit/offset in API)
2. **Index frequently queried columns** in database schema
3. **Cache API responses** in frontend hooks
4. **Optimize images** before uploading
5. **Use production build** for benchmarking

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS everywhere
- [ ] Set secure CORS origins
- [ ] Add password validation rules
- [ ] Implement rate limiting on auth endpoints
- [ ] Setup automated backups
- [ ] Enable query logging and monitoring
- [ ] Audit all user access permissions
- [ ] Set up error monitoring (Sentry, etc)

## Getting Help

1. **Check logs**: `pnpm dev` shows all errors
2. **API documentation**: See `BACKEND_API.md`
3. **Code structure**: See `README.md`
4. **Type definitions**: Check `lib/db-types.ts`
5. **Example code**: Look at existing features

## Quick Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run linter

# Database
sqlite3 .data/kapad-mitra.db  # Open SQLite shell
.tables               # List all tables
SELECT * FROM users;  # Query users

# Clean up
rm -rf node_modules .next .data
pnpm install
pnpm dev
```

---

For complete API documentation, see `BACKEND_API.md`. For project overview, see `README.md`.
