# PrimePOS Developer Onboarding Guide

## Quick Start

1. **Setup:** `cd frontend && npm install`
2. **Run:** `npm run dev`
3. **Read:** This guide and explore the codebase

## Key Architecture Points

### Tech Stack
- Next.js 14+ (App Router) + TypeScript
- Zustand (state) + React Context
- Radix UI + Tailwind CSS
- RESTful API integration

### Project Structure
- `app/` - Next.js pages (App Router)
- `components/` - Reusable components
- `lib/services/` - API service layer
- `stores/` - Zustand state management
- `contexts/` - React Context providers
- `locales/` - Translation files

### Key Patterns
1. **Service Layer:** All API calls via `lib/services/*.ts`
2. **Multi-Tenancy:** Managed via `TenantContext` and `businessStore`
3. **State:** Zustand for global state, Context for app-level data
4. **i18n:** Use `useI18n()` hook for translations

## Common Tasks

### Adding a Page
1. Create `app/dashboard/feature/page.tsx`
2. Use `DashboardLayout` + `PageLayout`
3. Import `useI18n()` for translations

### Adding API Service
1. Create `lib/services/newService.ts`
2. Add endpoints to `lib/api.ts`
3. Implement CRUD methods

### Creating Modal
1. Create `components/modals/new-modal.tsx`
2. Use `Dialog` from `@/components/ui/dialog`
3. Follow existing modal patterns

## Important Files

- `lib/api.ts` - API client configuration
- `lib/types/index.ts` - TypeScript definitions
- `stores/businessStore.ts` - Business/tenant state
- `contexts/tenant-context.tsx` - Multi-tenant context
- `middleware.ts` - Route protection

## Troubleshooting

- **"t is not defined"**  Add `const { t } = useI18n()`
- **API 401**  Check token in localStorage
- **Build errors**  Check TypeScript types and imports

See full guide below for detailed information.
