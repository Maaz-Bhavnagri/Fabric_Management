# KapadMitra - Fabric Store Management System

KapadMitra is a comprehensive, multilingual fabric store management application built with Next.js, React, and Tailwind CSS. It provides businesses with tools to manage inventory, sales, customers, and suppliers efficiently.

## Features

### Core Functionality
- **Dashboard**: Real-time business metrics, revenue trends, and sales analytics
- **Inventory Management**: Track fabrics, prices, stock levels, and suppliers
- **Sales Management**: Create and manage orders with status tracking
- **Customer Management**: Maintain customer profiles and purchase history
- **Supplier Management**: Track suppliers and their fabric supplies
- **Reports**: Sales reports, inventory reports, and revenue analysis
- **User Profile & Settings**: Manage account and application preferences

### Technical Highlights
- **Multilingual Support**: English, Gujarati (ગુજરાતી), and Hindi (हिंदी)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Professional dark UI optimized for fabric store operations
- **Mock Data**: Realistic sample data for demonstration and testing
- **API-Ready Architecture**: Easily replaceable with real backend APIs
- **Authentication System**: Secure login and registration (mock authentication)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: React Context API
- **Charting**: Recharts
- **Icons**: Lucide React
- **Multilingual**: Custom JSON-based i18n with React Context
- **Package Manager**: pnpm

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Login

- Navigate to the login page
- Use any email and a password with at least 6 characters
- For registration, provide business name and phone number
- The app uses mock authentication for demonstration

## Project Structure

```
/app
  /(app)                    # Protected app routes
    /dashboard              # Dashboard page
    /inventory              # Inventory management
    /sales                  # Sales/orders management
    /customers              # Customer management
    /suppliers              # Supplier management
    /reports                # Reports and analytics
    /profile                # User profile
    /settings               # App settings
    layout.tsx              # App layout with sidebar
  /auth                     # Authentication pages
  layout.tsx                # Root layout
  page.tsx                  # Landing page
  globals.css               # Global styles

/components
  /dashboard                # Dashboard components
  /inventory                # Inventory components
  /sales                    # Sales components
  /customers                # Customer components
  /suppliers                # Supplier components
  /layout                   # Layout components (Sidebar, Navbar)

/context
  AuthContext.tsx           # Authentication context
  LanguageContext.tsx       # Language/i18n context

/hooks
  useData.ts                # Custom hooks for data fetching

/lib
  translations.ts           # Translation keys and strings
  mockData.ts               # Mock database
  api-client.ts             # API client wrapper
  utils.ts                  # Utility functions
```

## Multilingual Support

The app supports 3 languages:
- **English** (en) - Default
- **Gujarati** (gu) - ગુજરાતી
- **Hindi** (hi) - हिंदी

Switch languages in the Settings page or using the language selector in the navbar.

## Mock Data

The application includes realistic mock data for:
- **15 Fabrics** with various types (Cotton, Silk, Wool, etc.)
- **10 Customers** with purchase history
- **5 Orders** with status tracking
- **8 Suppliers** with contact information

All data is stored in memory and will reset when the page refreshes.

## Authentication

The app uses mock authentication with localStorage:
- User credentials are stored locally
- Sessions persist across page refreshes
- Logout clears the session

For production, replace the mock auth in `context/AuthContext.tsx` with real API calls.

## Future Backend Integration

The application is designed to be easily integrated with a real backend:

1. **API Client**: Modify `/lib/api-client.ts` to call real endpoints instead of returning mock data
2. **Authentication**: Update `context/AuthContext.tsx` to handle real JWT tokens
3. **Hooks**: Keep the same hook interfaces - they'll automatically work with real data

Example modifications in `lib/api-client.ts`:
```typescript
export const inventoryApi = {
  getFabrics: async (searchTerm?: string) => {
    const response = await fetch(`/api/fabrics?search=${searchTerm}`);
    return response.json();
  },
  // ... other methods
};
```

## Styling & Customization

- Colors are defined as CSS variables in `app/globals.css`
- Uses Tailwind CSS for utility-first styling
- All UI components from shadcn/ui are customizable
- Dark theme is the default - modify globals.css for light theme

## Available Scripts

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check
```

## Performance Optimizations

- Lazy loading for route components
- Optimized images with Next.js Image component
- CSS-in-JS with Tailwind for smaller bundle
- Client-side data caching with hooks

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- Mock data is in-memory only - resets on page refresh
- Authentication is not secure - for demo purposes only
- No real data persistence
- Reports export is UI-only (no actual PDF/CSV export)

## Contributing

To add new features:

1. Create components in the appropriate `/components` directory
2. Add translation keys to `lib/translations.ts`
3. Use the existing data hooks for data management
4. Follow the established patterns for styling and structure

## License

This project is created as a demonstration project.

## Support

For issues or questions about the application, please refer to the code comments and implementation patterns used throughout the project.

---

**KapadMitra** - Empowering fabric businesses with modern technology.
