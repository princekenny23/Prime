 # Multi-Warehouse POS System Implementation Guide
## PrimePOS SaaS Platform

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Multi-Outlet Ready | 🔄 Warehouse Enhancement Available

---

## Executive Summary

**Current State:** PrimePOS is **already multi-warehouse capable** through its multi-outlet architecture. Each "Outlet" can function as a warehouse, retail store, or distribution center.

**Enhancement Opportunity:** Add explicit warehouse type classification and warehouse-specific workflows to optimize inventory management and POS operations.

---

## Current Architecture: Multi-Outlet = Multi-Warehouse

### How It Works Now

PrimePOS uses an **Outlet-based** architecture where:

```
Tenant (Business)
├── Outlet 1: "Main Warehouse"     ← Functions as warehouse
├── Outlet 2: "Downtown Store"     ← Functions as retail store
├── Outlet 3: "Distribution Center" ← Functions as warehouse
└── Outlet 4: "Airport Branch"     ← Functions as retail store
```

**Key Features Already Implemented:**

1. ✅ **Per-Outlet Inventory Tracking** (`LocationStock`)
   - Each outlet maintains separate stock levels
   - Stock is tracked per product variation per outlet
   - Real-time inventory updates per location

2. ✅ **Stock Transfers Between Outlets**
   - Transfer stock from warehouse to store
   - Transfer between warehouses
   - Transfer between stores
   - Full audit trail via `StockMovement`

3. ✅ **Outlet-Specific Sales**
   - Each sale is tied to a specific outlet
   - POS transactions deduct stock from selected outlet
   - Sales reports per outlet

4. ✅ **Multi-Location Stock Queries**
   - Check stock at any outlet
   - Aggregate stock across all outlets
   - Low stock alerts per outlet

---

## POS Flow: How Multi-Warehouse Works

### Current POS Flow (Multi-Outlet)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Selects Outlet                                  │
│    - User chooses which outlet/store to work from      │
│    - Outlet context is set for the session             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. POS Cart Operations                                   │
│    - Add products to cart                                │
│    - System checks stock at SELECTED outlet only        │
│    - Shows: "In Stock: 50 units" (at this outlet)       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Stock Availability Check                              │
│    - Query: LocationStock.filter(                        │
│              variation=product,                           │
│              outlet=selected_outlet)                     │
│    - If stock available → Allow sale                    │
│    - If stock low → Show warning                         │
│    - If out of stock → Prevent sale or suggest transfer │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Sale Completion                                       │
│    - Create Sale record with outlet reference           │
│    - Deduct stock from selected outlet's LocationStock  │
│    - Create StockMovement (movement_type='sale')         │
│    - Update outlet's inventory in real-time              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Stock Transfer (If Needed)                           │
│    - If store runs low, request transfer from warehouse │
│    - Create StockMovement:                               │
│      * transfer_out from warehouse                      │
│      * transfer_in to store                             │
│    - Update both outlets' LocationStock                  │
└─────────────────────────────────────────────────────────┘
```

### Example Scenario: Warehouse to Store Flow

**Setup:**
- **Main Warehouse**: 500 units of "Product X"
- **Downtown Store**: 10 units of "Product X"

**Customer at Store:**
1. Customer wants to buy 20 units
2. POS checks stock at "Downtown Store" → Only 10 available
3. **Option A**: System suggests transfer from warehouse
4. **Option B**: Create backorder/partial sale
5. **Option C**: Check if warehouse can fulfill (if integrated)

**Transfer Process:**
1. Store manager requests transfer from warehouse
2. Warehouse staff approves and ships 50 units
3. System records:
   - `StockMovement`: transfer_out from warehouse (-50)
   - `StockMovement`: transfer_in to store (+50)
4. Store stock: 10 → 60 units
5. Warehouse stock: 500 → 450 units
6. Customer can now complete purchase

---

## Enhancement: Explicit Warehouse Types

### Why Enhance?

While the current system works, adding explicit warehouse types enables:

1. **Better Workflow Optimization**
   - Warehouses: Focus on receiving, transfers, bulk operations
   - Stores: Focus on sales, customer service, quick transfers

2. **Role-Based Access**
   - Warehouse staff: Can't process sales, only inventory operations
   - Store staff: Can process sales, request transfers

3. **Smart Stock Allocation**
   - Auto-suggest warehouse as source for transfers
   - Prioritize warehouse stock for bulk orders
   - Reserve warehouse stock for wholesale customers

4. **Reporting & Analytics**
   - Separate warehouse vs store metrics
   - Warehouse efficiency reports
   - Store performance vs warehouse stock levels

### Proposed Enhancement

#### 1. Add Outlet Type Field

```python
# backend/apps/outlets/models.py

class Outlet(models.Model):
    OUTLET_TYPES = [
        ('warehouse', 'Warehouse'),
        ('store', 'Retail Store'),
        ('distribution', 'Distribution Center'),
        ('popup', 'Pop-up Store'),
        ('online', 'Online Fulfillment Center'),
    ]
    
    # ... existing fields ...
    outlet_type = models.CharField(
        max_length=20,
        choices=OUTLET_TYPES,
        default='store',
        help_text="Type of outlet (warehouse, store, etc.)"
    )
    is_warehouse = models.BooleanField(
        default=False,
        help_text="Quick flag: Is this a warehouse? (for filtering)"
    )
    can_process_sales = models.BooleanField(
        default=True,
        help_text="Can this outlet process POS sales? (warehouses typically cannot)"
    )
    default_source_for_transfers = models.BooleanField(
        default=False,
        help_text="Use as default source for stock transfers"
    )
```

#### 2. Update POS Flow with Warehouse Awareness

```python
# Enhanced POS Stock Check

def check_stock_for_sale(product, outlet, quantity):
    """
    Check if outlet has stock, with warehouse fallback
    """
    # Check selected outlet first
    location_stock = LocationStock.objects.get(
        variation=product.variation,
        outlet=outlet
    )
    
    if location_stock.quantity >= quantity:
        return {
            'available': True,
            'source': outlet,
            'quantity': location_stock.quantity
        }
    
    # If store doesn't have enough, check warehouses
    if outlet.outlet_type != 'warehouse':
        warehouses = Outlet.objects.filter(
            tenant=outlet.tenant,
            outlet_type='warehouse',
            is_active=True
        )
        
        for warehouse in warehouses:
            warehouse_stock = LocationStock.objects.filter(
                variation=product.variation,
                outlet=warehouse
            ).first()
            
            if warehouse_stock and warehouse_stock.quantity >= quantity:
                return {
                    'available': True,
                    'source': warehouse,
                    'quantity': warehouse_stock.quantity,
                    'needs_transfer': True,
                    'suggested_transfer': {
                        'from': warehouse,
                        'to': outlet,
                        'quantity': quantity
                    }
                }
    
    return {
        'available': False,
        'message': 'Insufficient stock at this location'
    }
```

#### 3. Warehouse-Specific Workflows

**Warehouse Operations:**
- ✅ Receive stock from suppliers
- ✅ Transfer stock to stores
- ✅ Bulk stock adjustments
- ✅ Warehouse-to-warehouse transfers
- ❌ Process POS sales (unless configured otherwise)

**Store Operations:**
- ✅ Process POS sales
- ✅ Request transfers from warehouse
- ✅ Receive transfers from warehouse
- ✅ Customer returns
- ❌ Receive directly from suppliers (typically)

---

## Implementation Guide

### Phase 1: Database Migration (Backend)

**Step 1: Create Migration**
```bash
python manage.py makemigrations outlets --name add_outlet_type
```

**Step 2: Migration Content**
```python
# Generated migration file

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('outlets', '0001_initial'),  # Adjust to your last migration
    ]

    operations = [
        migrations.AddField(
            model_name='outlet',
            name='outlet_type',
            field=models.CharField(
                choices=[
                    ('warehouse', 'Warehouse'),
                    ('store', 'Retail Store'),
                    ('distribution', 'Distribution Center'),
                    ('popup', 'Pop-up Store'),
                    ('online', 'Online Fulfillment Center'),
                ],
                default='store',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='outlet',
            name='is_warehouse',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='outlet',
            name='can_process_sales',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='outlet',
            name='default_source_for_transfers',
            field=models.BooleanField(default=False),
        ),
    ]
```

**Step 3: Data Migration (Set existing outlets)**
```python
# In the same migration file, add data migration

def set_warehouse_types(apps, schema_editor):
    Outlet = apps.get_model('outlets', 'Outlet')
    
    # Set existing outlets based on name patterns or manual classification
    # This is a one-time setup - admins can update via UI later
    for outlet in Outlet.objects.all():
        name_lower = outlet.name.lower()
        if 'warehouse' in name_lower or 'wh' in name_lower:
            outlet.outlet_type = 'warehouse'
            outlet.is_warehouse = True
            outlet.can_process_sales = False
            outlet.default_source_for_transfers = True
        else:
            outlet.outlet_type = 'store'
            outlet.is_warehouse = False
            outlet.can_process_sales = True
        outlet.save()

class Migration(migrations.Migration):
    # ... operations ...
    
    operations = [
        # ... field additions ...
        migrations.RunPython(set_warehouse_types),
    ]
```

### Phase 2: Backend API Updates

**Update Serializer:**
```python
# backend/apps/outlets/serializers.py

class OutletSerializer(serializers.ModelSerializer):
    outlet_type = serializers.ChoiceField(choices=Outlet.OUTLET_TYPES)
    is_warehouse = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Outlet
        fields = [
            'id', 'name', 'address', 'phone', 'email',
            'outlet_type', 'is_warehouse', 'can_process_sales',
            'default_source_for_transfers', 'is_active',
            'created_at', 'updated_at'
        ]
```

**Add Warehouse Filtering:**
```python
# backend/apps/outlets/views.py

class OutletViewSet(viewsets.ModelViewSet):
    # ... existing code ...
    
    filterset_fields = [
        'is_active', 'tenant', 
        'outlet_type',  # NEW
        'is_warehouse',  # NEW
        'can_process_sales'  # NEW
    ]
    
    @action(detail=False, methods=['get'])
    def warehouses(self, request):
        """Get all warehouses for the tenant"""
        queryset = self.get_queryset().filter(
            outlet_type='warehouse',
            is_active=True
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stores(self, request):
        """Get all retail stores for the tenant"""
        queryset = self.get_queryset().filter(
            outlet_type='store',
            is_active=True
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

### Phase 3: Frontend Updates

**Update Outlet Selection:**
```typescript
// frontend/lib/services/outletService.ts

export interface Outlet {
  id: string
  name: string
  outlet_type: 'warehouse' | 'store' | 'distribution' | 'popup' | 'online'
  is_warehouse: boolean
  can_process_sales: boolean
  default_source_for_transfers: boolean
  // ... other fields
}

export const outletService = {
  async listWarehouses(): Promise<Outlet[]> {
    return api.get('/api/v1/outlets/warehouses/')
  },
  
  async listStores(): Promise<Outlet[]> {
    return api.get('/api/v1/outlets/stores/')
  },
}
```

**Update POS Stock Check:**
```typescript
// frontend/app/dashboard/pos/components/stock-check.tsx

const checkStockWithWarehouseFallback = async (
  productId: string,
  outletId: string,
  quantity: number
) => {
  // Check outlet stock
  const outletStock = await checkStock(productId, outletId)
  
  if (outletStock.quantity >= quantity) {
    return { available: true, source: 'outlet', stock: outletStock }
  }
  
  // If store, check warehouses
  const outlet = await getOutlet(outletId)
  if (outlet.outlet_type !== 'warehouse') {
    const warehouses = await outletService.listWarehouses()
    
    for (const warehouse of warehouses) {
      const warehouseStock = await checkStock(productId, warehouse.id)
      if (warehouseStock.quantity >= quantity) {
        return {
          available: true,
          source: 'warehouse',
          stock: warehouseStock,
          needsTransfer: true,
          suggestedTransfer: {
            from: warehouse.id,
            to: outletId,
            quantity
          }
        }
      }
    }
  }
  
  return { available: false }
}
```

**Update Outlet Management UI:**
```typescript
// frontend/app/dashboard/settings/outlets-and-tills-management/page.tsx

// Add outlet type selector in form
<Select
  value={formData.outlet_type}
  onValueChange={(value) => setFormData({ ...formData, outlet_type: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select outlet type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="warehouse">Warehouse</SelectItem>
    <SelectItem value="store">Retail Store</SelectItem>
    <SelectItem value="distribution">Distribution Center</SelectItem>
    <SelectItem value="popup">Pop-up Store</SelectItem>
    <SelectItem value="online">Online Fulfillment</SelectItem>
  </SelectContent>
</Select>

{formData.outlet_type === 'warehouse' && (
  <div className="space-y-2">
    <Checkbox
      checked={formData.can_process_sales}
      onCheckedChange={(checked) =>
        setFormData({ ...formData, can_process_sales: checked })
      }
    >
      Allow POS sales at this warehouse
    </Checkbox>
    <Checkbox
      checked={formData.default_source_for_transfers}
      onCheckedChange={(checked) =>
        setFormData({ ...formData, default_source_for_transfers: checked })
      }
    >
      Use as default source for transfers
    </Checkbox>
  </div>
)}
```

### Phase 4: POS Flow Enhancements

**Smart Stock Suggestions:**
```typescript
// When adding product to cart in POS

const handleAddToCart = async (product: Product) => {
  const currentOutlet = getCurrentOutlet()
  const stockCheck = await checkStockWithWarehouseFallback(
    product.id,
    currentOutlet.id,
    1
  )
  
  if (!stockCheck.available) {
    toast({
      title: "Out of Stock",
      description: "Product not available at this location",
      variant: "destructive"
    })
    return
  }
  
  if (stockCheck.needsTransfer) {
    // Show transfer suggestion
    setShowTransferSuggestion({
      product,
      from: stockCheck.suggestedTransfer.from,
      to: currentOutlet.id,
      quantity: stockCheck.suggestedTransfer.quantity
    })
  }
  
  addToCart(product)
}
```

**Transfer Request Modal:**
```typescript
// Component to request transfer from warehouse

<Dialog open={showTransferSuggestion}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Stock Available at Warehouse</DialogTitle>
      <DialogDescription>
        This product is available at {warehouseName}. Would you like to request a transfer?
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Transfer Quantity</Label>
        <Input
          type="number"
          value={transferQuantity}
          onChange={(e) => setTransferQuantity(parseInt(e.target.value))}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={requestTransfer}>
          Request Transfer
        </Button>
        <Button variant="outline" onClick={handleContinueWithoutTransfer}>
          Continue Without Transfer
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

## Benefits of Warehouse Enhancement

### 1. **Operational Efficiency**
- Clear separation of warehouse vs store operations
- Optimized workflows per location type
- Reduced errors (warehouse staff can't accidentally process sales)

### 2. **Better Inventory Management**
- Smart stock allocation suggestions
- Automatic warehouse prioritization for transfers
- Better visibility into stock distribution

### 3. **Improved Reporting**
- Warehouse-specific metrics (receiving, transfers, efficiency)
- Store-specific metrics (sales, customer service)
- Cross-location analytics

### 4. **Scalability**
- Easy to add new warehouses or stores
- Flexible configuration per location
- Supports complex distribution networks

---

## Migration Path

### For Existing Installations

1. **Backward Compatible**: All existing outlets default to `outlet_type='store'`
2. **Gradual Migration**: Admins can update outlet types via UI
3. **No Breaking Changes**: Existing functionality continues to work
4. **Optional Enhancement**: Can be enabled/disabled per tenant

### Recommended Steps

1. ✅ Run database migration
2. ✅ Update backend API (add outlet_type field)
3. ✅ Update frontend outlet management UI
4. ✅ Classify existing outlets (manual or automated)
5. ✅ Update POS flow with warehouse awareness
6. ✅ Add warehouse-specific workflows
7. ✅ Update reports and analytics

---

## API Endpoints (After Enhancement)

```
GET  /api/v1/outlets/                    # All outlets
GET  /api/v1/outlets/warehouses/         # Only warehouses
GET  /api/v1/outlets/stores/             # Only stores
GET  /api/v1/outlets/{id}/               # Single outlet
POST /api/v1/outlets/                    # Create outlet (with type)
PUT  /api/v1/outlets/{id}/               # Update outlet (including type)

GET  /api/v1/inventory/stock/?outlet={id}              # Stock at outlet
GET  /api/v1/inventory/stock/?outlet_type=warehouse    # Stock at all warehouses
GET  /api/v1/inventory/transfers/                      # Transfer history
POST /api/v1/inventory/transfers/                      # Create transfer
```

---

## Conclusion

**Current State:** ✅ PrimePOS is already multi-warehouse capable through its multi-outlet architecture.

**Enhancement Value:** 🔄 Adding explicit warehouse types provides:
- Better workflow optimization
- Role-based access control
- Smart stock allocation
- Enhanced reporting

**Implementation Effort:** 🟢 Low-Medium
- Database: 1 migration
- Backend: Add fields, update serializers/views
- Frontend: Update UI components, enhance POS flow
- Testing: Verify existing functionality, test new features

**Recommendation:** Implement the enhancement to unlock full multi-warehouse potential while maintaining backward compatibility.

---

## Questions & Support

For implementation questions or clarifications, refer to:
- `MULTI_OUTLET_ARCHITECTURE.md` - Current architecture details
- `backend/apps/outlets/models.py` - Outlet model structure
- `backend/apps/inventory/models.py` - LocationStock model
- `backend/apps/sales/models.py` - Sale model with outlet reference

