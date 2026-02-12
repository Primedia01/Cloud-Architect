# Government OOH Booking System

## Overview
Automated Out-of-Home (OOH) Booking Platform for a South African government department. Manages campaign planning, supplier coordination, artwork/compliance document management, invoice generation, and post-campaign reporting.

## Recent Changes
- 2026-02-12: Initial build - full-stack application with all screens, database, API, auth, and deployment files

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend API)
- **State**: TanStack React Query for server state, React Context for auth

## Project Structure
```
client/src/
  components/     - UI components and layout
  pages/          - Route pages (login, dashboard, campaigns, bookings, documents, invoices, admin)
  hooks/          - Custom hooks (use-auth, use-toast, use-mobile)
  lib/            - API client, query client, utilities
server/
  index.ts        - Express server entry
  routes.ts       - API routes (/api/*)
  storage.ts      - Database operations (Drizzle ORM)
shared/
  schema.ts       - Database schema and types
```

## Key Files
- `shared/schema.ts` - Data model (users, suppliers, campaigns, bookings, documents, invoices)
- `server/storage.ts` - DatabaseStorage class with all CRUD operations
- `server/routes.ts` - REST API endpoints
- `client/src/hooks/use-auth.tsx` - Auth context and role-based access
- `client/src/components/layout.tsx` - Main layout with sidebar navigation

## User Roles
- department_admin, campaign_planner, finance_officer, supplier_admin, supplier_user, auditor

## Default Login Credentials (Development)
- admin / admin123 (Department Admin)
- planner / planner123 (Campaign Planner)
- finance / finance123 (Finance Officer)
- supplier / supplier123 (Supplier Admin)
- auditor / auditor123 (Auditor)

## Seed Data
POST /api/seed to populate test data (users, suppliers, campaigns, bookings, invoices)

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
