# Restaurant Module - Remaining Work
## What's Left to Complete for Restaurant Tenant

---

## 📊 **Current Status**

### ✅ **Completed Features**

1. **Table Management**
   - ✅ Create, read, update, delete tables
   - ✅ Table status management (available, occupied, reserved, out_of_service)
   - ✅ Table capacity and location
   - ✅ Table grid/list view
   - ✅ Table filtering and search

2. **Kitchen Order Tickets (KOT)**
   - ✅ Automatic KOT creation when order sent to kitchen
   - ✅ KOT number generation
   - ✅ KOT status tracking (pending, preparing, ready, served)
   - ✅ Item-level kitchen status
   - ✅ Priority management (normal, high, urgent)

3. **Kitchen Display System (KDS)**
   - ✅ Kitchen page with pending/ready orders
   - ✅ Item status updates
   - ✅ Real-time order display
   - ✅ Auto-refresh functionality

4. **Order Management**
   - ✅ Orders page with KOT integration
   - ✅ Order details view
   - ✅ Payment processing for orders
   - ✅ Order status tracking
   - ✅ Order filtering (active, ready, completed)

5. **Restaurant POS**
   - ✅ Table selection
   - ✅ Product grid display
   - ✅ Category filtering
   - ✅ Cart management
   - ✅ Send to kitchen functionality
   - ✅ Payment processing

6. **Menu Builder (Basic)**
   - ✅ Menu items listing (uses products)
   - ✅ Product-based menu items
   - ✅ Category organization

---

## 🚧 **Remaining Work**

### **1. Reservations System** 🔴 **HIGH PRIORITY**

#### **Backend Required:**
- [ ] Create `Reservation` model
  - Fields: tenant, outlet, customer, table, date, time, party_size, status, notes, created_at, updated_at
  - Status choices: pending, confirmed, seated, cancelled, completed
- [ ] Create `ReservationViewSet` with CRUD operations
- [ ] Add reservation endpoints: `/api/v1/restaurant/reservations/`
- [ ] Add reservation filtering (date, status, table)
- [ ] Add reservation conflict checking
- [ ] Add reservation reminders (optional)

#### **Frontend Required:**
- [ ] Create `/dashboard/restaurant/reservations/page.tsx`
- [ ] Reservation calendar view
- [ ] Reservation list view
- [ ] Create reservation modal
- [ ] Edit reservation modal
- [ ] Reservation status management
- [ ] Table availability checking
- [ ] Reservation notifications

**Estimated Time:** 2-3 days

---

### **2. Recipe Management** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Create `Recipe` model
  - Fields: tenant, outlet, name, description, menu_item (FK to Product), portions, cost, ingredients (JSON), instructions, created_at, updated_at
- [ ] Create `RecipeIngredient` model (optional - for detailed tracking)
  - Fields: recipe, product, quantity, unit, cost
- [ ] Create `RecipeViewSet` with CRUD operations
- [ ] Add recipe endpoints: `/api/v1/restaurant/recipes/`
- [ ] Recipe cost calculation
- [ ] Recipe-to-menu-item linking

#### **Frontend Required:**
- [ ] Connect `/dashboard/restaurant/recipes/page.tsx` to real API
- [ ] Recipe creation/editing modal (backend integration)
- [ ] Ingredient management
- [ ] Cost calculation display
- [ ] Recipe-to-product linking

**Estimated Time:** 1-2 days

---

### **3. Menu Modifiers & Customizations** 🔴 **HIGH PRIORITY**

#### **Backend Required:**
- [ ] Create `MenuModifier` model
  - Fields: tenant, outlet, name, type (addon, substitution, option), price_adjustment, is_required, created_at, updated_at
- [ ] Create `MenuModifierGroup` model
  - Fields: tenant, outlet, name, min_selections, max_selections, modifiers (M2M)
- [ ] Link modifiers to products
- [ ] Create `ProductModifier` model (M2M relationship)
- [ ] Add modifier endpoints: `/api/v1/restaurant/menu-modifiers/`
- [ ] Update `SaleItem` to store selected modifiers (JSON field or M2M)

#### **Frontend Required:**
- [ ] Modifier management page
- [ ] Modifier selection in POS
- [ ] Modifier display in cart
- [ ] Modifier display in KOT
- [ ] Modifier pricing calculations

**Estimated Time:** 2-3 days

---

### **4. Combo Meals / Set Meals** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Create `ComboMeal` model
  - Fields: tenant, outlet, name, description, price, items (M2M to Product), image, is_active
- [ ] Create `ComboMealItem` model (for quantity tracking)
  - Fields: combo_meal, product, quantity, is_optional
- [ ] Add combo meal endpoints: `/api/v1/restaurant/combo-meals/`
- [ ] Update POS to handle combo meals
- [ ] Combo meal pricing logic

#### **Frontend Required:**
- [ ] Combo meal management page
- [ ] Combo meal creation/editing
- [ ] Combo meal display in POS
- [ ] Combo meal selection in cart

**Estimated Time:** 2 days

---

### **5. Table Operations** 🟢 **LOW PRIORITY**

#### **Backend Required:**
- [ ] Table merge functionality
  - Merge multiple tables into one order
  - Update table statuses
- [ ] Table split functionality
  - Split one table into multiple orders
- [ ] Table transfer functionality
  - Transfer order from one table to another
- [ ] Add endpoints: `/api/v1/tables/{id}/merge/`, `/api/v1/tables/{id}/split/`, `/api/v1/tables/{id}/transfer/`

#### **Frontend Required:**
- [ ] Connect merge/split/transfer modals to backend
- [ ] Table operation confirmation
- [ ] Order history tracking

**Estimated Time:** 1-2 days

---

### **6. Order Modifications** 🔴 **HIGH PRIORITY**

#### **Backend Required:**
- [ ] Order modification after KOT creation
  - Add items to existing order
  - Remove items (if not started)
  - Modify item quantities
  - Add notes/modifiers
- [ ] Order cancellation
  - Cancel entire order
  - Cancel specific items
  - Refund handling
- [ ] Add endpoints: `/api/v1/sales/{id}/add-items/`, `/api/v1/sales/{id}/remove-items/`, `/api/v1/sales/{id}/cancel/`

#### **Frontend Required:**
- [ ] Modify order button/modal
- [ ] Add items to existing order
- [ ] Remove items from order
- [ ] Cancel order functionality
- [ ] Order modification history

**Estimated Time:** 2-3 days

---

### **7. KOT Printing** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] KOT print template
- [ ] KOT PDF generation (optional)
- [ ] Print endpoint: `/api/v1/restaurant/kitchen-orders/{id}/print/`

#### **Frontend Required:**
- [ ] Print KOT button
- [ ] Print preview modal
- [ ] Print template customization
- [ ] Printer selection

**Estimated Time:** 1-2 days

---

### **8. Server Assignment** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Add `server` field to `Sale` model (already exists via `user`)
- [ ] Add server assignment to KOT
- [ ] Server performance tracking
- [ ] Server assignment endpoints

#### **Frontend Required:**
- [ ] Server selection in POS
- [ ] Server assignment in orders
- [ ] Server performance dashboard
- [ ] Server filtering in orders

**Estimated Time:** 1 day

---

### **9. Table Status Auto-Update** 🟢 **LOW PRIORITY**

#### **Backend Required:**
- [ ] Auto-update table status when order created
- [ ] Auto-update table status when order completed
- [ ] Table status history
- [ ] Signal handlers for status updates

#### **Frontend Required:**
- [ ] Real-time table status updates
- [ ] Table status history view
- [ ] Status change notifications

**Estimated Time:** 1 day

---

### **10. Wait Time Tracking** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Add wait time fields to KOT
  - `estimated_prep_time` (minutes)
  - `actual_prep_time` (calculated)
- [ ] Wait time calculation logic
- [ ] Wait time alerts

#### **Frontend Required:**
- [ ] Wait time display in kitchen
- [ ] Wait time display in orders
- [ ] Wait time alerts
- [ ] Wait time statistics

**Estimated Time:** 1 day

---

### **11. Menu Item Availability** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Add `is_available` field to Product (may already exist)
- [ ] Add `available_from` and `available_until` (time-based availability)
- [ ] Add `available_days` (day-of-week availability)
- [ ] Availability checking logic

#### **Frontend Required:**
- [ ] Availability toggle in menu builder
- [ ] Time-based availability settings
- [ ] Day-based availability settings
- [ ] Availability display in POS
- [ ] Out-of-stock/Unavailable indicators

**Estimated Time:** 1-2 days

---

### **12. Special Requests & Notes** 🟢 **LOW PRIORITY**

#### **Backend Required:**
- [ ] Enhanced notes system
- [ ] Item-level special requests (already exists in SaleItem.notes)
- [ ] Order-level special requests (already exists in Sale.notes)
- [ ] Special request categories

#### **Frontend Required:**
- [ ] Enhanced notes input in POS
- [ ] Special request templates
- [ ] Notes display in KOT
- [ ] Notes display in orders

**Estimated Time:** 1 day

---

### **13. Floor Plan Management** 🟢 **LOW PRIORITY**

#### **Backend Required:**
- [ ] Create `FloorPlan` model
  - Fields: tenant, outlet, name, layout_data (JSON), image, is_active
- [ ] Create `TablePosition` model (optional)
  - Fields: table, floor_plan, x, y, width, height
- [ ] Floor plan endpoints: `/api/v1/restaurant/floor-plans/`

#### **Frontend Required:**
- [ ] Floor plan editor
- [ ] Drag-and-drop table placement
- [ ] Floor plan visualization
- [ ] Multiple floor plans support

**Estimated Time:** 3-4 days

---

### **14. Promotions & Happy Hour** 🟡 **MEDIUM PRIORITY**

#### **Backend Required:**
- [ ] Create `Promotion` model
  - Fields: tenant, outlet, name, type (discount, happy_hour, combo), discount_type (percentage, fixed), discount_value, start_time, end_time, days_of_week, products (M2M), is_active
- [ ] Promotion calculation logic
- [ ] Promotion endpoints: `/api/v1/restaurant/promotions/`

#### **Frontend Required:**
- [ ] Promotion management page
- [ ] Promotion creation/editing
- [ ] Promotion display in POS
- [ ] Automatic discount application

**Estimated Time:** 2-3 days

---

### **15. Menu Sections/Categories Enhancement** 🟢 **LOW PRIORITY**

#### **Backend Required:**
- [ ] Menu section ordering
- [ ] Menu section display settings
- [ ] Menu section images
- [ ] Menu section descriptions

#### **Frontend Required:**
- [ ] Menu section management
- [ ] Section ordering in menu builder
- [ ] Section display in POS
- [ ] Section images

**Estimated Time:** 1 day

---

## 📋 **Priority Summary**

### **🔴 High Priority (Must Have)**
1. **Reservations System** - Essential for restaurant operations
2. **Menu Modifiers & Customizations** - Critical for order accuracy
3. **Order Modifications** - Needed for customer service

### **🟡 Medium Priority (Should Have)**
4. **Recipe Management** - Important for cost control
5. **Combo Meals** - Common restaurant feature
6. **KOT Printing** - Useful for kitchen operations
7. **Server Assignment** - Helpful for service management
8. **Wait Time Tracking** - Improves customer experience
9. **Menu Item Availability** - Prevents ordering unavailable items
10. **Promotions & Happy Hour** - Revenue optimization

### **🟢 Low Priority (Nice to Have)**
11. **Table Operations** - Advanced feature
12. **Table Status Auto-Update** - Enhancement
13. **Special Requests & Notes** - Enhancement
14. **Floor Plan Management** - Advanced feature
15. **Menu Sections Enhancement** - Enhancement

---

## ⏱️ **Estimated Timeline**

### **Phase 1: Critical Features (1 week)**
- Reservations System
- Menu Modifiers
- Order Modifications

### **Phase 2: Important Features (1 week)**
- Recipe Management
- Combo Meals
- KOT Printing
- Server Assignment

### **Phase 3: Enhancements (1 week)**
- Wait Time Tracking
- Menu Item Availability
- Promotions & Happy Hour
- Table Operations

### **Phase 4: Advanced Features (1 week)**
- Floor Plan Management
- Menu Sections Enhancement
- Special Requests Enhancement
- Table Status Auto-Update

**Total Estimated Time: 4 weeks**

---

## 🎯 **Quick Wins (Can be done quickly)**

1. **KOT Printing** - 1-2 days
2. **Server Assignment** - 1 day
3. **Menu Item Availability** - 1-2 days
4. **Wait Time Tracking** - 1 day
5. **Table Status Auto-Update** - 1 day

**Total Quick Wins: 5-7 days**

---

## 📝 **Implementation Notes**

### **Database Considerations**
- All new models should include `tenant` ForeignKey for multi-tenancy
- Use proper indexes for performance
- Consider JSON fields for flexible data (modifiers, floor plans)

### **API Design**
- Follow RESTful conventions
- Use proper HTTP status codes
- Include pagination for list endpoints
- Add filtering and search capabilities

### **Frontend Considerations**
- Use existing UI components where possible
- Follow existing patterns (modals, tables, forms)
- Ensure responsive design
- Add loading states and error handling

### **Testing Requirements**
- Unit tests for models
- API endpoint tests
- Frontend component tests
- Integration tests for critical flows

---

## 🔗 **Dependencies**

### **External Dependencies**
- None required for basic features
- PDF generation library for KOT printing (optional)
- Calendar library for reservations (optional)

### **Internal Dependencies**
- Products module (for menu items)
- Sales module (for orders)
- Customers module (for reservations)
- Staff module (for server assignment)

---

## ✅ **Completion Checklist**

### **Backend**
- [ ] Reservations model and API
- [ ] Recipe model and API
- [ ] Menu modifiers model and API
- [ ] Combo meals model and API
- [ ] Table operations endpoints
- [ ] Order modification endpoints
- [ ] KOT printing endpoint
- [ ] Server assignment logic
- [ ] Wait time tracking
- [ ] Menu availability logic
- [ ] Promotions model and API
- [ ] Floor plan model and API

### **Frontend**
- [ ] Reservations page
- [ ] Recipe management (backend integration)
- [ ] Modifier management
- [ ] Combo meal management
- [ ] Table operations (backend integration)
- [ ] Order modification UI
- [ ] KOT printing
- [ ] Server assignment UI
- [ ] Wait time display
- [ ] Menu availability settings
- [ ] Promotions management
- [ ] Floor plan editor

---

**Last Updated:** Current Date
**Status:** Restaurant module is ~60% complete
**Next Steps:** Focus on High Priority items first

