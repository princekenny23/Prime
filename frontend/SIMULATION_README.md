# PrimePOS Simulation System

## 🎯 Full System Simulation Mode

The entire PrimePOS system runs in **Simulation Mode** with no backend calls. All data is stored in Zustand stores and localStorage, allowing you to test the complete UX before backend integration.

### Simulation Mode Features

- ✅ **No Backend Calls**: All operations use mock API layer (`lib/mockApi.ts`)
- ✅ **Visual Indicator**: "SIMULATION MODE" badge in navbar
- ✅ **Data Management**: Export/Import simulation data as JSON
- ✅ **Reset Functionality**: Clear all data and start fresh
- ✅ **Full Persistence**: All data persists across page reloads

### Accessing Simulation Controls

Navigate to **Settings → Simulation** tab to:
- Export all simulation data as JSON
- Import previously exported data
- Reset all simulation data (with confirmation)

### Simulation Mode Badge

A blue "SIMULATION MODE" badge appears in the top navbar to indicate the system is running in simulation mode.

---

# PrimePOS Simulation System

This document describes the complete mock simulation system for PrimePOS, which enables full frontend testing without a backend.

## 🎯 Overview

The simulation system uses:
- **localStorage** as the mock database
- **Zustand** for global state management
- **Mock API layer** (`/lib/mockApi.ts`) for data operations
- **Industry-specific dashboards** for Retail, Restaurant, and Bar businesses

## 📁 Architecture

### Core Files

```
lib/
├── types/mock-data.ts      # TypeScript interfaces for all data types
├── mockApi.ts              # Mock API layer (localStorage operations)

stores/
├── authStore.ts            # Authentication state (Zustand)
└── businessStore.ts        # Business management state (Zustand)

app/
├── auth/login/            # Login page (simulated)
├── onboarding/            # Business creation wizard
├── dashboard/
│   ├── page.tsx           # Main dashboard (redirects to industry-specific)
│   ├── retail/page.tsx    # Retail dashboard
│   ├── restaurant/page.tsx # Restaurant dashboard
│   └── bar/page.tsx       # Bar dashboard
```

## 🔄 User Flow

### 1. Authentication Flow

```
Login → Check Businesses → 
  ├─ No businesses → Onboarding Wizard
  └─ Has businesses → Business Selection
```

**Login Page** (`/app/auth/login/page.tsx`):
- Accepts any email/password (simulation)
- Creates user if doesn't exist
- Saves to localStorage via `authStore`
- Redirects based on business existence

### 2. Business Creation (Onboarding)

**Onboarding Wizard** (`/app/onboarding/page.tsx`):
- **Step 1**: Business Name
- **Step 2**: Business Type (Retail, Restaurant, Bar)
- **Step 3**: Contact Details (Currency, Phone, Email, Address)
- **Step 4**: First Outlet (Name, Address, Phone)

**What Gets Created**:
- Business record in `mockDB.businesses`
- First outlet in `mockDB.outlets`
- User linked to business
- Redirects to industry-specific dashboard

### 3. Business Selection

**Admin Dashboard** (`/app/admin/page.tsx`):
- Lists all businesses from localStorage in a grid layout
- Shows: Name, Type, Outlets, Users, Total Revenue, Creation Date
- "Create Business" button for SaaS admins
- Clicking a business card → Sets current business → Redirects to industry dashboard
- Regular users can also access to select their business

### 4. Industry-Specific Dashboards

After business selection, users are routed to:

- **Retail** → `/dashboard/retail`
- **Restaurant** → `/dashboard/restaurant`
- **Bar** → `/dashboard/bar`

Each dashboard shows:
- Today's Sales
- Total Products/Menu Items
- Total Sales
- Industry-specific metrics
- Quick action cards
- Recent activity

## 🗄️ Mock Data Structure

### Database Schema (localStorage)

```typescript
{
  businesses: Business[],
  outlets: Outlet[],
  users: User[],
  products: Product[],
  categories: Category[],
  sales: Sale[],
  staff: Staff[]
}
```

### Key Types

**Business**:
```typescript
{
  id: string
  name: string
  type: "retail" | "restaurant" | "bar"
  currency: string
  currencySymbol: string
  phone: string
  email: string
  settings: BusinessSettings
}
```

**Sale**:
```typescript
{
  id: string
  businessId: string
  outletId: string
  items: SaleItem[]
  total: number
  paymentMethod: "cash" | "card" | "mobile" | "tab"
  createdAt: string
}
```

## 🔌 Mock API Functions

All functions in `/lib/mockApi.ts`:

### Business Operations
- `getBusinesses()` - Get all businesses
- `getBusiness(id)` - Get single business
- `addBusiness(business)` - Create business
- `updateBusiness(id, updates)` - Update business

### Outlet Operations
- `getOutlets(businessId?)` - Get outlets (optionally filtered)
- `getOutlet(id)` - Get single outlet
- `addOutlet(outlet)` - Create outlet

### Product Operations
- `getProducts(businessId?)` - Get products
- `getProduct(id)` - Get single product
- `addProduct(product)` - Create product
- `updateProduct(id, updates)` - Update product
- `deleteProduct(id)` - Delete product

### Sale Operations
- `getSales(businessId?, outletId?)` - Get sales
- `getSalesToday(businessId?, outletId?)` - Get today's sales
- `addSale(sale)` - Create sale

### Dashboard Stats
- `getDashboardStats(businessId, outletId?)` - Get all dashboard metrics

## 🎨 Zustand Stores

### Auth Store (`stores/authStore.ts`)

```typescript
{
  user: User | null
  isAuthenticated: boolean
  login(email, password) - Simulated login
  logout() - Clear user
  setUser(user) - Set current user
}
```

**Persistence**: Saved to localStorage as `primepos-auth`

### Business Store (`stores/businessStore.ts`)

```typescript
{
  currentBusiness: Business | null
  currentOutlet: Outlet | null
  businesses: Business[]
  outlets: Outlet[]
  setCurrentBusiness(id) - Switch business
  setCurrentOutlet(id) - Switch outlet
  loadBusinesses() - Refresh from localStorage
  loadOutlets(businessId) - Load outlets for business
}
```

**Persistence**: Saved to localStorage as `primepos-business`

## 🔀 Routing Logic

### Main Dashboard (`/dashboard`)

Automatically redirects:
- If `currentBusiness` exists → `/dashboard/{business.type}`
- If no business → `/admin` (to select business)

### Industry Dashboards

Each dashboard:
1. Checks if `currentBusiness` exists
2. Validates business type matches route
3. Redirects if mismatch
4. Displays industry-specific content

## 🛒 POS Integration

The POS page (`/dashboard/pos`) should:
- Use `currentBusiness` and `currentOutlet` from store
- Load products via `getProducts(businessId)`
- Save sales via `addSale(sale)`
- Update dashboard stats automatically

## 📊 Data Flow Example

### Creating a Sale

```
1. User adds items to cart (POS page)
2. User completes payment
3. Call: addSale({
     businessId: currentBusiness.id,
     outletId: currentOutlet.id,
     items: cartItems,
     total: calculatedTotal,
     ...
   })
4. Sale saved to localStorage
5. Dashboard stats update automatically
6. Recent sales list updates
```

### Adding a Product

```
1. User fills product form
2. Call: addProduct({
     businessId: currentBusiness.id,
     name: "...",
     price: 100,
     ...
   })
3. Product saved to localStorage
4. Product list updates
5. Dashboard product count updates
```

## 🔄 Business Switching

**Navbar Business Switcher**:
- Dropdown shows all businesses
- On selection:
  - `setCurrentBusiness(businessId)`
  - `router.push(/dashboard/${business.type})`
  - Loads business-specific data

## 🧪 Testing the Simulation

### 1. Start Fresh
```javascript
// Clear all data
localStorage.clear()
```

### 2. Create Business
1. Login with any email/password
2. Complete onboarding wizard
3. Should redirect to industry dashboard

### 3. Create Multiple Businesses
1. Go to `/admin` (or use admin credentials)
2. Click "Create Business" button
3. Complete onboarding
4. Repeat for different industries

### 4. Switch Businesses
1. Use business switcher in navbar
2. Select different business
3. Dashboard should update

### 5. Make a Sale
1. Go to POS
2. Add products to cart
3. Complete payment
4. Check dashboard for updated stats

## 📝 Integration Checklist

To connect existing pages to mock API:

- [ ] **Products Page**: Use `getProducts()`, `addProduct()`, `updateProduct()`
- [ ] **Sales Page**: Use `getSales()`, `getSalesToday()`
- [ ] **POS Page**: Use `getProducts()`, `addSale()`
- [ ] **Staff Page**: Use `getStaff()`, `addStaff()`
- [ ] **Outlets Page**: Use `getOutlets()`, `addOutlet()`
- [ ] **Reports**: Use `getSales()`, `getDashboardStats()`
- [ ] **Categories**: Use `getCategories()`, `addCategory()`

## 🚀 Future Backend Integration

When connecting to real backend:

1. Replace `mockApi.ts` functions with API calls
2. Keep Zustand stores (update to fetch from API)
3. Keep routing logic (no changes needed)
4. Update data types if API differs

The mock API layer is designed to be easily replaceable with real API calls.

## 🐛 Troubleshooting

### Data Not Persisting
- Check localStorage in browser DevTools
- Verify Zustand persist middleware is working
- Check for localStorage quota issues

### Wrong Dashboard Loading
- Verify `currentBusiness.type` matches route
- Check business store is loading correctly
- Verify redirect logic in dashboard pages

### Products Not Showing
- Ensure `businessId` is set when fetching
- Check products are saved with correct `businessId`
- Verify `currentBusiness` is set in store

## 📚 Key Concepts

1. **Everything is in localStorage** - No server, no database
2. **Zustand manages state** - Global state with persistence
3. **Mock API abstracts data** - Easy to replace with real API
4. **Industry-specific routing** - Each business type has its dashboard
5. **Multi-business support** - Users can switch between businesses

## 🎯 Success Criteria

The simulation is working when you can:
- ✅ Login with any credentials
- ✅ Create multiple businesses (different types)
- ✅ Switch between businesses
- ✅ See industry-specific dashboards
- ✅ Add products and see them in lists
- ✅ Make sales and see stats update
- ✅ All data persists after page refresh

---

**Note**: This is a simulation system for frontend development and testing. All data is stored locally and will be lost if localStorage is cleared.

