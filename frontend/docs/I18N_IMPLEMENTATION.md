# PrimePOS Internationalization (i18n) Implementation Guide

## Overview

PrimePOS implements a production-grade i18n system supporting **English (en)** and **Chichewa (ny)** for the Malawian market. This system is designed for POS environments where:

- Speed is critical (cashiers work under pressure)
- Translations must be clear and unambiguous
- Language switching cannot interrupt active sales
- Numbers, currency, and product names remain unchanged

---

## Architecture

### File Structure

```
frontend/
├── locales/
│   ├── en/                    # English translations
│   │   ├── common.json        # Shared UI strings
│   │   ├── pos.json           # POS interface
│   │   ├── products.json      # Product management
│   │   ├── inventory.json     # Inventory management
│   │   ├── sales.json         # Sales & transactions
│   │   ├── customers.json     # Customer management
│   │   ├── reports.json       # Reports & analytics
│   │   ├── settings.json      # Settings pages
│   │   ├── shifts.json        # Shift management
│   │   └── validation.json    # Form validation messages
│   │
│   └── ny/                    # Chichewa translations
│       └── (same structure as en/)
│
├── lib/
│   └── i18n/
│       ├── index.ts           # Core i18n functions
│       └── receipt-labels.ts  # Receipt-specific translations
│
├── contexts/
│   └── i18n-context.tsx       # React context provider
│
├── hooks/
│   └── use-translation.ts     # Translation hooks
│
└── components/
    ├── language-switcher.tsx  # Language selection UI
    └── pos/
        └── pos-translations.tsx  # POS-specific translation hooks
```

---

## Usage

### Basic Translation Hook

```tsx
import { useI18n } from "@/contexts/i18n-context"

function MyComponent() {
  const { t, locale, setLocale } = useI18n()
  
  return (
    <div>
      <h1>{t("common.navigation.dashboard")}</h1>
      <p>{t("pos.cart.empty")}</p>
      <button onClick={() => setLocale("ny")}>
        {t("common.language.chichewa")}
      </button>
    </div>
  )
}
```

### Namespace-Specific Hook

```tsx
import { useTranslation } from "@/contexts/i18n-context"

function POSComponent() {
  const { t, locale } = useTranslation("pos")
  
  return (
    <div>
      <h1>{t("title")}</h1>                    {/* pos.title */}
      <p>{t("cart.empty")}</p>                 {/* pos.cart.empty */}
      <button>{t("payment.complete")}</button> {/* pos.payment.complete */}
    </div>
  )
}
```

### POS-Specific Labels Hook

```tsx
import { usePOSLabels } from "@/components/pos/pos-translations"

function RetailPOS() {
  const { labels, locale, isReady } = usePOSLabels()
  
  return (
    <div>
      <h1>{labels.terminal}</h1>
      <span>{labels.total}: MK 1,000.00</span>
      <button>{labels.completeSale}</button>
    </div>
  )
}
```

### Validation Messages

```tsx
import { useValidationTranslations } from "@/hooks/use-translation"

function MyForm() {
  const validation = useValidationTranslations()
  
  const validate = (value) => {
    if (!value) return validation.required("name")
    if (value.length < 3) return validation.minLength(3)
    return null
  }
}
```

---

## Translation Key Conventions

### Key Structure

```
namespace.section.specific_key
```

Examples:
- `pos.cart.empty` → POS → Cart section → Empty state
- `common.actions.save` → Common → Actions → Save button
- `validation.required.email` → Validation → Required fields → Email

### Naming Rules

1. Use **snake_case** for multi-word keys: `new_sale`, `low_stock`
2. Group related keys under sections: `cart.title`, `cart.empty`, `cart.clear`
3. Use clear, descriptive names: `insufficient_payment` not `insuf_pay`
4. Avoid abbreviations in keys

---

## Adding New Translations

### Step 1: Add to English file

```json
// locales/en/pos.json
{
  "new_feature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "button": "Enable Feature"
  }
}
```

### Step 2: Add to Chichewa file

```json
// locales/ny/pos.json
{
  "new_feature": {
    "title": "Chinthu Chatsopano",
    "description": "Ichi ndi chinthu chatsopano",
    "button": "Yatsani Chinthu"
  }
}
```

### Step 3: Use in component

```tsx
const { t } = useTranslation("pos")

return (
  <div>
    <h2>{t("new_feature.title")}</h2>
    <p>{t("new_feature.description")}</p>
    <button>{t("new_feature.button")}</button>
  </div>
)
```

---

## Chichewa Translation Guidelines

### General Principles

1. **Clarity over literal translation** - Use common business terms
2. **Keep it simple** - Avoid academic Chichewa
3. **Be consistent** - Same English term = same Chichewa translation
4. **POS context** - Use terms cashiers understand

### Common POS Terms

| English | Chichewa | Notes |
|---------|----------|-------|
| Dashboard | Gawo Lalikulu | "Main Section" |
| Sales | Malonda | |
| Products | Zinthu | "Things/Items" |
| Customers | Makasitomala | |
| Inventory | Katundu | "Goods/Stock" |
| Total | Zonse | "All/Everything" |
| Cash | Ndalama | |
| Change | Chenjiyo | |
| Receipt | Risiti | Borrowed word |
| Price | Mtengo | |
| Quantity | Kuchuluka | |
| Save | Sungani | |
| Cancel | Lekani | |
| Confirm | Tsimikizani | |
| Search | Sakani | |
| Add | Onjezani | |
| Edit | Sinthani | |
| Delete | Chotsani | |
| Low Stock | Katundu Wochepa | "Few Goods" |
| Out of Stock | Zatha | "Finished" |

### What NOT to Translate

- Product names
- Currency amounts (MK 1,000.00)
- Barcodes and SKUs
- Customer names
- Receipt numbers
- Technical IDs

---

## Language Persistence

### Storage Priority

1. **Tenant Settings** (database) - Business-level preference
2. **localStorage** - Quick access for returning users
3. **Default (English)** - Fallback

### How It Works

```tsx
// On app load:
1. Check localStorage for 'primepos_locale'
2. If logged in, check tenant.settings.language
3. Use tenant preference if available
4. Fall back to localStorage or English

// On language change:
1. Update React state immediately
2. Store in localStorage
3. Save to tenant settings (API call)
4. Dispatch 'locale-changed' event
```

---

## Receipt Translations

Receipts require special handling because:
- They must align correctly (fixed-width)
- Text must fit thermal printer width
- Professional appearance is critical

### Usage

```tsx
import { getReceiptLabels, formatPaymentMethod } from "@/lib/i18n/receipt-labels"
import { useI18n } from "@/contexts/i18n-context"

function Receipt({ sale }) {
  const { locale } = useI18n()
  const labels = getReceiptLabels(locale)
  
  return (
    <pre>
      {labels.receipt}
      {labels.receiptNumber}: {sale.receipt_number}
      {labels.date}: {sale.date}
      
      {sale.items.map(item => (
        <div>{item.name} x{item.qty} = MK {item.total}</div>
      ))}
      
      {labels.total}: MK {sale.total}
      {labels.paymentMethod}: {formatPaymentMethod(sale.payment_method, locale)}
      
      {labels.thankYou}
    </pre>
  )
}
```

---

## Performance Considerations

### Optimizations Implemented

1. **Lazy Loading** - Translations loaded on demand
2. **Caching** - Loaded translations cached in memory
3. **Pre-computed Labels** - POS labels computed once, not on every render
4. **No Page Refresh** - Language switches without reload

### Best Practices

```tsx
// ✅ GOOD: Use pre-computed labels for frequently rendered content
const { labels } = usePOSLabels()
return <div>{labels.total}</div>

// ✅ GOOD: Memoize translation results
const buttonLabels = useMemo(() => ({
  save: t("common.actions.save"),
  cancel: t("common.actions.cancel"),
}), [t])

// ❌ BAD: Don't call t() in loops without memoization
items.map(item => <span>{t("products.item")}: {item.name}</span>)

// ✅ GOOD: Compute outside the loop
const itemLabel = t("products.item")
items.map(item => <span>{itemLabel}: {item.name}</span>)
```

---

## Testing

### Missing Translation Detection

In development mode, missing translation keys are logged:
```
[i18n] Missing translation: pos.new_unimplemented_feature
```

### Manual Testing Checklist

- [ ] Switch language in settings
- [ ] Verify POS screen labels update instantly
- [ ] Complete a sale in each language
- [ ] Print receipt in each language
- [ ] Verify validation messages appear correctly
- [ ] Check reports display correctly
- [ ] Verify shift management works in both languages

---

## Backend Integration

### Tenant Settings

Language preference is stored in the tenant's settings JSON field:

```python
# backend/apps/tenants/models.py
class Tenant(models.Model):
    settings = models.JSONField(default=dict)
    # settings = {"language": "ny", ...}
```

### API

```http
GET /api/v1/tenants/{id}/
Response: { "settings": { "language": "ny" } }

PUT /api/v1/tenants/{id}/
Body: { "settings": { "language": "en" } }
```

---

## Troubleshooting

### Language Not Saving

1. Check browser localStorage: `localStorage.getItem('primepos_locale')`
2. Check tenant API response for `settings.language`
3. Verify API calls in Network tab

### Missing Translations

1. Check if key exists in JSON file
2. Verify namespace in hook matches file name
3. Check for typos in key path

### Performance Issues

1. Avoid calling `t()` in tight loops
2. Use pre-computed labels for POS screens
3. Check for unnecessary re-renders

---

## Future Enhancements

- [ ] Add more languages (Portuguese, French, Swahili)
- [ ] Implement right-to-left (RTL) support if needed
- [ ] Add translation management UI for admins
- [ ] Implement pluralization rules
- [ ] Add date/time localization

---

*Last Updated: December 2024*

