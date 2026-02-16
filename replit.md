# Government OOH Booking System

## Overview
Automated Out-of-Home (OOH) Booking Platform for a South African government department. Manages campaign planning, supplier coordination, artwork/compliance document management, invoice generation, post-campaign reporting, and real-time inventory availability across multiple OOH suppliers. All data must remain within South Africa (Azure SA North/West regions), be POPIA-compliant, and support role-based access control.

## Recent Changes
- 2026-02-16: Added supplier-scoped inventory access control — supplier users only see/manage their own inventory; logout clears React Query cache to prevent stale data between sessions
- 2026-02-15: Added Live Inventory page with real-time screen availability, stats cards, search/filters, data table, detail panel, and CRUD operations for 8 seeded screens across Gauteng, Western Cape, and KwaZulu-Natal
- 2026-02-12: Initial build — full-stack application with all screens, database, API, auth, and deployment files

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend API)
- **State**: TanStack React Query for server state, React Context for auth
- **Auth**: localStorage-based session with user-id header sent on all API requests; logout clears query cache

## Project Structure
```
client/src/
  components/     - UI components and layout
  pages/          - Route pages (login, dashboard, campaigns, bookings, documents, invoices, inventory, admin)
  hooks/          - Custom hooks (use-auth, use-toast, use-mobile)
  lib/            - API client (with user-id header), query client, utilities
server/
  index.ts        - Express server entry
  routes.ts       - API routes (/api/*) with role-based access control
  storage.ts      - Database operations (Drizzle ORM)
shared/
  schema.ts       - Database schema and types
```

## Key Files
- `shared/schema.ts` - Data model (users, suppliers, campaigns, bookings, documents, invoices, inventory)
- `server/storage.ts` - DatabaseStorage class with all CRUD operations
- `server/routes.ts` - REST API endpoints with supplier-scoped filtering
- `client/src/hooks/use-auth.tsx` - Auth context, role-based access, cache clearing on logout
- `client/src/components/layout.tsx` - Main layout with sidebar navigation
- `client/src/pages/inventory.tsx` - Live Inventory page with supplier-scoped access

## User Roles
- department_admin, campaign_planner, finance_officer, supplier_admin, supplier_user, auditor

## Access Control
- **Government roles** (department_admin, campaign_planner, finance_officer, auditor): See all inventory across all suppliers
- **Supplier roles** (supplier_admin, supplier_user): Only see and manage inventory belonging to their own supplier (filtered by supplierId on the backend)
- Supplier users adding new screens have their supplierId auto-assigned (supplier selector hidden in UI)
- Query keys include user ID so data refreshes properly on user switch

## Default Login Credentials (Development)
- admin / admin123 (Department Admin — sees all 8 inventory items)
- planner / planner123 (Campaign Planner)
- finance / finance123 (Finance Officer)
- supplier / supplier123 (Supplier Admin — linked to JCDecaux SA, sees only 4 items)
- auditor / auditor123 (Auditor)

## Seed Data
POST /api/seed to populate test data (users, suppliers, campaigns, bookings, invoices, inventory)
- 2 suppliers: JCDecaux South Africa, Primedia Outdoor
- 8 inventory screens across Gauteng, Western Cape, KwaZulu-Natal
- Supplier user linked to JCDecaux via supplierId

## Design
- Professional government color scheme (navy/slate)
- Inter font family
- Clean, accessible, WCAG-friendly layout
- Role-based navigation (sidebar adapts per user role)
- ZAR currency formatting, en-ZA date formatting

## Deployment
- Dockerfile included for Azure App Service
- web.config for Azure SPA fallback
- .env.example for environment variables
- Data sovereignty: Azure SA North/West regions required
