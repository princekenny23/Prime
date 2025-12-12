# Multi-Language Integration Plan for PrimePOS

**Version:** 1.0  
**Last Updated:** 2024  
**System:** Next.js Frontend + Django Backend Multi-Tenant SaaS POS

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Content Classification](#2-content-classification)
3. [Frontend Implementation (Next.js)](#3-frontend-implementation-nextjs)
4. [Backend Implementation (Django)](#4-backend-implementation-django)
5. [User Preference Management](#5-user-preference-management)
6. [Implementation Strategy](#6-implementation-strategy)
7. [Key Integration Points](#7-key-integration-points)
8. [Language Switcher Component](#8-language-switcher-component)
9. [Special Considerations](#9-special-considerations)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration Strategy](#11-migration-strategy)
12. [Performance Considerations](#12-performance-considerations)

---

## 1. Architecture Overview

PrimePOS is a multi-tenant SaaS POS system with:
- **Frontend**: Next.js 13+ (App Router), TypeScript, React
- **Backend**: Django REST Framework, PostgreSQL
- **Content Types**: UI text, user-generated content (products, categories), system messages, reports, receipts

### Supported Languages (Initial)
- English (en) - Default
- Spanish (es)
- French (fr)
- Portuguese (pt)
- Swahili (sw)
- Chinese (zh)

---

## 2. Content Classification

### A. System UI Text (Must Translate)
- Navigation labels (sidebar, breadcrumbs)
- Buttons (Save, Cancel, Delete, Edit, etc.)
- Form labels and placeholders
- Error messages and validation text
- Notification titles and messages
- Page titles and descriptions
- Table headers and column names
- Tooltips and help text
- Status labels (Active, Inactive, Pending, etc.)
- Modal titles and content

### B. User-Generated Content (Optional Translation)
- Product names and descriptions
- Category names
- Customer names (usually keep as-is)
- Supplier names (usually keep as-is)
- Notes and comments
- Custom fields

### C. Dynamic System Content
- Report headers and column names
- Receipt templates
- Email templates
- SMS templates
- Activity log messages
- Error messages from backend

---

## 3. Frontend Implementation (Next.js)

### A. Library Choice: `next-intl`

**Why next-intl:**
- ✅ Built for Next.js App Router
- ✅ Type-safe translations
- ✅ Server and client components support
- ✅ URL-based locale routing
- ✅ Lazy loading support
- ✅ Excellent performance

**Installation:**
```bash
npm install next-intl
```

### B. File Structure

```
frontend/
├── messages/                    # Translation files
│   ├── en.json                 # English (default)
│   ├── es.json                 # Spanish
│   ├── fr.json                 # French
│   ├── pt.json                 # Portuguese
│   ├── sw.json                 # Swahili
│   └── zh.json                 # Chinese
├── i18n/
│   ├── config.ts               # i18n configuration
│   ├── request.ts              # Server-side locale detection
│   └── routing.ts              # Routing configuration
└── middleware.ts                # Update to handle locale routing
```

### C. Translation File Structure

**Example: `messages/en.json`**
```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "search": "Search",
      "filter": "Filter",
      "export": "Export",
      "import": "Import"
    },
    "labels": {
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "phone": "Phone",
      "address": "Address",
      "status": "Status",
      "date": "Date",
      "amount": "Amount"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
  },
  "auth": {
    "login": {
      "title": "Welcome back",
      "subtitle": "Sign in to your PrimePOS account",
      "email": "Email",
      "password": "Password",
      "forgotPassword": "Forgot password?",
      "loginButton": "Login",
      "signingIn": "Signing in..."
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "sales": "Sales",
    "inventory": "Inventory",
    "customers": "Customers",
    "reports": "Reports"
  },
  "products": {
    "title": "Products",
    "addProduct": "Add Product",
    "editProduct": "Edit Product",
    "productName": "Product Name",
    "price": "Price",
    "cost": "Cost",
    "stock": "Stock",
    "category": "Category",
    "sku": "SKU",
    "barcode": "Barcode"
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "loginFailed": "Login failed. Please try again.",
    "networkError": "Network error. Please check your connection."
  },
  "notifications": {
    "success": {
      "saved": "Saved successfully",
      "deleted": "Deleted successfully",
      "updated": "Updated successfully"
    },
    "error": {
      "saveFailed": "Failed to save",
      "deleteFailed": "Failed to delete",
      "loadFailed": "Failed to load data"
    }
  }
}
```

### D. Integration Points

#### 1. Root Layout (`app/layout.tsx`)
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({ children }) {
  const messages = await getMessages();
  
  return (
    <html>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### 2. Pages (`app/**/page.tsx`)
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations('products');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('addProduct')}</button>
    </div>
  );
}
```

#### 3. Components (`components/**/*.tsx`)
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function SaveButton() {
  const t = useTranslations('common.buttons');
  
  return <button>{t('save')}</button>;
}
```

#### 4. Services (`lib/services/*.ts`)
- Error messages from backend should be translatable
- API error handling with translation keys
- Add `Accept-Language` header to all requests

#### 5. Stores (`stores/*.ts`)
- Store user language preference
- Sync with backend user settings
- Persist to localStorage

---

## 4. Backend Implementation (Django)

### A. Django i18n Setup

#### 1. Settings (`backend/primepos/settings/base.py`)

```python
# Add to INSTALLED_APPS (if not already present)
INSTALLED_APPS = [
    # ... other apps
    'django.middleware.locale.LocaleMiddleware',
]

# Add to MIDDLEWARE (after SessionMiddleware, before CommonMiddleware)
MIDDLEWARE = [
    # ... other middleware
    'django.middleware.locale.LocaleMiddleware',
    # ... rest of middleware
]

# Supported languages
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('pt', 'Portuguese'),
    ('sw', 'Swahili'),
    ('zh', 'Chinese'),
]

LANGUAGE_CODE = 'en'  # Default language

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# Timezone support
USE_I18N = True
USE_L10N = True
USE_TZ = True
```

#### 2. Translation Files Structure

```
backend/
├── locale/
│   ├── en/
│   │   └── LC_MESSAGES/
│   │       └── django.po
│   ├── es/
│   │   └── LC_MESSAGES/
│   │       └── django.po
│   ├── fr/
│   │   └── LC_MESSAGES/
│   │       └── django.po
│   └── ...
```

### B. Model Changes

#### 1. User Model (`backend/apps/accounts/models.py`)

```python
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    # ... existing fields
    
    language = models.CharField(
        max_length=10,
        default='en',
        choices=[
            ('en', 'English'),
            ('es', 'Spanish'),
            ('fr', 'French'),
            ('pt', 'Portuguese'),
            ('sw', 'Swahili'),
            ('zh', 'Chinese'),
        ],
        help_text=_('User preferred language')
    )
    
    class Meta:
        # ... existing meta
```

#### 2. Tenant Model (`backend/apps/tenants/models.py`)

```python
class Tenant(models.Model):
    # ... existing fields
    
    # Add to settings JSONField or as separate field
    default_language = models.CharField(
        max_length=10,
        default='en',
        choices=[
            ('en', 'English'),
            ('es', 'Spanish'),
            ('fr', 'French'),
            ('pt', 'Portuguese'),
            ('sw', 'Swahili'),
            ('zh', 'Chinese'),
        ],
        help_text='Default language for this tenant'
    )
    
    # Or add to settings JSONField:
    # settings = models.JSONField(default=dict, blank=True)
    # Then store: settings['default_language'] = 'en'
```

#### 3. Product/Category Models (Optional - for user-generated content)

```python
# For multi-language product names
class ProductTranslation(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='translations'
    )
    language = models.CharField(max_length=10)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['product', 'language']
        indexes = [
            models.Index(fields=['product', 'language']),
        ]
```

### C. API Changes

#### 1. Serializers

```python
from django.utils.translation import gettext_lazy as _

class ProductSerializer(serializers.ModelSerializer):
    # Detect language from request
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request:
            language = self._get_language_from_request(request)
            # Apply translations if needed
            data['name'] = self._get_translated_name(instance, language)
        
        return data
    
    def _get_language_from_request(self, request):
        # Priority: User preference > Accept-Language header > Default
        if hasattr(request.user, 'language') and request.user.language:
            return request.user.language
        
        accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        # Parse Accept-Language header
        # ...
        
        return 'en'  # Default
```

#### 2. Views

```python
from django.utils import translation
from django.utils.translation import gettext_lazy as _

class ProductViewSet(viewsets.ModelViewSet):
    def dispatch(self, request, *args, **kwargs):
        # Detect and activate language
        language = self._detect_language(request)
        translation.activate(language)
        
        try:
            return super().dispatch(request, *args, **kwargs)
        finally:
            translation.deactivate()
    
    def _detect_language(self, request):
        # Priority order:
        # 1. User.language (if authenticated)
        # 2. Accept-Language header
        # 3. Tenant.default_language
        # 4. Default 'en'
        
        if request.user.is_authenticated and hasattr(request.user, 'language'):
            if request.user.language:
                return request.user.language
        
        accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        if accept_language:
            # Parse and return first supported language
            # ...
        
        # Check tenant default
        tenant = getattr(request, 'tenant', None)
        if tenant and hasattr(tenant, 'default_language'):
            return tenant.default_language
        
        return 'en'
```

#### 3. Middleware

```python
# backend/apps/tenants/middleware.py (or create new i18n middleware)

from django.utils import translation
from django.utils.deprecation import MiddlewareMixin

class LanguageMiddleware(MiddlewareMixin):
    """
    Custom middleware to set language based on user preference,
    tenant default, or Accept-Language header.
    """
    
    def process_request(self, request):
        language = self._detect_language(request)
        translation.activate(language)
        request.LANGUAGE_CODE = translation.get_language()
    
    def process_response(self, request, response):
        translation.deactivate()
        return response
    
    def _detect_language(self, request):
        # Same logic as in views
        # ...
        return 'en'
```

---

## 5. User Preference Management

### A. Storage Locations

#### 1. User Level (`User.language`)
- **Purpose**: Personal preference
- **Storage**: `accounts.User` model
- **Scope**: Overrides tenant default
- **Update**: User settings page

#### 2. Tenant Level (`Tenant.settings.default_language`)
- **Purpose**: Business default language
- **Storage**: `tenants.Tenant.settings` JSONField or separate field
- **Scope**: Used for new users, fallback for existing users
- **Update**: Business settings page

#### 3. Session/Cookie (Frontend)
- **Purpose**: Temporary preference before login
- **Storage**: Browser localStorage or sessionStorage
- **Scope**: Browser-based, not persisted
- **Update**: Language switcher component

### B. Preference Flow

```
1. User logs in
   ↓
2. Check User.language (if authenticated)
   ↓
3. If not set → Check Tenant.settings.default_language
   ↓
4. If not set → Check browser Accept-Language header
   ↓
5. If not set → Default to 'en'
   ↓
6. Store in frontend store (Zustand)
   ↓
7. Persist in localStorage
   ↓
8. Send to backend in API requests (Accept-Language header)
```

### C. API Endpoints

#### Update User Language
```
PATCH /api/v1/accounts/auth/users/{id}/
Body: { "language": "es" }
```

#### Update Tenant Default Language
```
PATCH /api/v1/tenants/{id}/
Body: { "default_language": "es" }
```

---

## 6. Implementation Strategy

### Phase 1: Foundation (Week 1-2)

1. **Install Dependencies**
   ```bash
   # Frontend
   npm install next-intl
   
   # Backend (Django i18n is built-in)
   # No additional packages needed
   ```

2. **Create Translation Files**
   - Create `messages/` directory
   - Create `en.json` with complete structure
   - Create placeholder files for other languages

3. **Update Root Layout**
   - Add `NextIntlClientProvider`
   - Configure locale detection
   - Update `app/layout.tsx`

4. **Update Middleware**
   - Handle locale routing
   - Detect language from various sources
   - Update `middleware.ts`

5. **Create i18n Configuration**
   - Create `i18n/config.ts`
   - Create `i18n/request.ts`
   - Create `i18n/routing.ts`

### Phase 2: Core UI Translation (Week 3-4)

1. **Common Components**
   - Buttons, inputs, labels
   - Error messages
   - Navigation items
   - Update `components/ui/*.tsx`

2. **Layout Components**
   - Sidebar navigation
   - Header
   - Footer
   - Update `components/layouts/*.tsx`

3. **Auth Pages**
   - Login page
   - Register page (if exists)
   - Forgot password
   - Update `app/auth/**/*.tsx`

### Phase 3: Feature Pages (Week 5-8)

1. **Dashboard Pages**
   - All `/dashboard/**` pages
   - Statistics labels
   - Table headers
   - Update all `app/dashboard/**/page.tsx`

2. **POS Interface**
   - Product display
   - Cart labels
   - Payment buttons
   - Update `components/pos/*.tsx`

3. **Settings Pages**
   - All settings labels
   - Form fields
   - Update `app/dashboard/settings/**/*.tsx`

### Phase 4: Backend Integration (Week 9-10)

1. **API Error Messages**
   - Translate validation errors
   - Translate business logic errors
   - Update all serializers

2. **Notifications**
   - Translate notification titles/messages
   - Based on user language preference
   - Update `apps/notifications/services.py`

3. **Reports**
   - Translate report headers
   - Column names
   - Summary labels
   - Update `apps/reports/views.py`

### Phase 5: User-Generated Content (Optional - Week 11-12)

1. **Product Translations**
   - Multi-language product names
   - Category translations
   - Create `ProductTranslation` model

2. **Customer/Supplier Names**
   - Keep as-is (user input)
   - No translation needed

---

## 7. Key Integration Points

### Frontend Files to Modify

1. **`app/layout.tsx`**
   - Add `NextIntlClientProvider`
   - Configure locale provider

2. **`middleware.ts`**
   - Add locale routing logic
   - Detect language from request

3. **`app/providers.tsx`**
   - Add language context provider
   - Sync with user preference

4. **`stores/authStore.ts`**
   - Add language state
   - Store user language preference

5. **`lib/api.ts`**
   - Add `Accept-Language` header to all requests
   - Read from store or localStorage

6. **All Page Components**
   - Replace hardcoded strings with `t()` calls
   - Use `useTranslations()` hook

7. **All UI Components**
   - Replace hardcoded strings with `t()` calls
   - Use `useTranslations()` hook

### Backend Files to Modify

1. **`apps/accounts/models.py`**
   - Add `language` field to User model
   - Create migration

2. **`apps/tenants/models.py`**
   - Add `default_language` field or add to settings
   - Create migration

3. **`apps/accounts/serializers.py`**
   - Include language in user serializer
   - Add update endpoint for language

4. **`apps/tenants/serializers.py`**
   - Include default_language in tenant serializer

5. **`primepos/settings/base.py`**
   - Configure Django i18n
   - Add LOCALE_PATHS
   - Configure LANGUAGES

6. **All Serializers**
   - Translate error messages
   - Use `gettext_lazy` for translatable strings

7. **All Views**
   - Detect and apply language
   - Use translation middleware

---

## 8. Language Switcher Component

### Location: `components/dashboard/language-switcher.tsx`

### Features:
- Dropdown in navbar (next to user menu)
- Shows current language with flag icon
- Updates user preference immediately
- Persists to backend via API
- Updates all UI immediately (no page refresh)
- Shows available languages

### Implementation:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/lib/services/userService';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const currentLanguage = user?.language || 'en';
  
  const handleLanguageChange = async (langCode: string) => {
    try {
      // Update backend
      if (user) {
        await userService.update(user.id, { language: langCode });
        setUser({ ...user, language: langCode });
      }
      
      // Update localStorage
      localStorage.setItem('language', langCode);
      
      // Reload page to apply new language
      router.refresh();
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };
  
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">
          <Globe className="h-4 w-4" />
          <span>{currentLang.flag}</span>
          <span className="text-sm">{currentLang.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLanguage === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Integration in Navbar:

Add to `components/layouts/dashboard-layout.tsx`:
```typescript
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';

// In navbar, add before user menu:
<LanguageSwitcher />
```

---

## 9. Special Considerations

### A. Date/Time Formatting

- Use `date-fns` with locale support
- Format dates based on user language
- Timezone from tenant settings

```typescript
import { format } from 'date-fns';
import { enUS, es, fr, pt, zhCN } from 'date-fns/locale';

const locales = {
  en: enUS,
  es: es,
  fr: fr,
  pt: pt,
  zh: zhCN,
};

const formatDate = (date: Date, language: string) => {
  return format(date, 'PPpp', { locale: locales[language] || enUS });
};
```

### B. Currency Formatting

- Currency symbol from tenant
- Number formatting by locale
- Decimal separators (comma vs period)

```typescript
const formatCurrency = (amount: number, currency: string, language: string) => {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

### C. RTL Languages (Future)

- Arabic, Hebrew support
- CSS direction changes
- Layout mirroring
- Use `next-intl` RTL support

### D. Receipt Templates

- Multi-language receipt headers
- Translated field labels
- Language-specific formatting
- Update `components/pos/receipt-preview.tsx`

---

## 10. Testing Strategy

### A. Unit Tests

1. **Translation Key Coverage**
   - Ensure all keys exist in all language files
   - Test missing translation detection
   - Test fallback to English

2. **Component Tests**
   - Test components with different languages
   - Verify text rendering
   - Test language switching

### B. Integration Tests

1. **Language Switching**
   - Test language switcher component
   - Verify UI updates
   - Test persistence

2. **API Language Detection**
   - Test Accept-Language header
   - Test user preference priority
   - Test tenant default fallback

3. **User Preference Persistence**
   - Test saving to backend
   - Test loading from backend
   - Test localStorage sync

### C. E2E Tests

1. **Full Flow in Different Languages**
   - Login in different languages
   - Navigate through app
   - Perform operations (add product, create sale)

2. **POS Operations**
   - Test POS interface in different languages
   - Verify all labels translate
   - Test receipt generation

3. **Report Generation**
   - Generate reports in different languages
   - Verify headers and labels
   - Test export functionality

---

## 11. Migration Strategy

### A. Start with English (Baseline)

1. Create complete `en.json` file
2. Replace all hardcoded strings with translation keys
3. Test thoroughly in English

### B. Add Translation Keys Incrementally

1. Add keys as you translate pages
2. Use English as fallback for missing keys
3. Track translation progress

### C. Add Languages One at a Time

1. Start with most requested language (e.g., Spanish)
2. Translate all keys
3. Test thoroughly
4. Add next language

### D. Translation Management

- Consider using translation management tools:
  - Crowdin
  - Lokalise
  - Phrase
  - Or manual translation with review process

---

## 12. Performance Considerations

### A. Lazy Loading

- Load translation files on demand
- Code splitting by locale
- Only load active language initially

### B. Caching

- Cache translations in browser (localStorage)
- Server-side caching for API translations
- CDN caching for static translation files

### C. Bundle Size

- Only include active language in initial bundle
- Dynamic imports for other languages
- Minimize translation file sizes

### D. Optimization Tips

1. **Tree-shaking**: Remove unused translation keys
2. **Compression**: Compress translation JSON files
3. **CDN**: Serve translation files from CDN
4. **Preloading**: Preload likely next language

---

## 13. File Checklist

### Frontend Files to Create/Modify

- [ ] `messages/en.json` - English translations
- [ ] `messages/es.json` - Spanish translations
- [ ] `messages/fr.json` - French translations
- [ ] `messages/pt.json` - Portuguese translations
- [ ] `messages/sw.json` - Swahili translations
- [ ] `messages/zh.json` - Chinese translations
- [ ] `i18n/config.ts` - i18n configuration
- [ ] `i18n/request.ts` - Server-side locale detection
- [ ] `i18n/routing.ts` - Routing configuration
- [ ] `components/dashboard/language-switcher.tsx` - Language switcher
- [ ] `app/layout.tsx` - Add NextIntlClientProvider
- [ ] `middleware.ts` - Add locale routing
- [ ] `app/providers.tsx` - Add language context
- [ ] `stores/authStore.ts` - Add language state
- [ ] `lib/api.ts` - Add Accept-Language header
- [ ] All page components - Replace strings with `t()`
- [ ] All UI components - Replace strings with `t()`

### Backend Files to Create/Modify

- [ ] `apps/accounts/models.py` - Add language field
- [ ] `apps/accounts/migrations/XXXX_add_language_to_user.py` - Migration
- [ ] `apps/tenants/models.py` - Add default_language
- [ ] `apps/tenants/migrations/XXXX_add_default_language.py` - Migration
- [ ] `apps/accounts/serializers.py` - Include language
- [ ] `apps/tenants/serializers.py` - Include default_language
- [ ] `primepos/settings/base.py` - Configure i18n
- [ ] `locale/en/LC_MESSAGES/django.po` - Django translations
- [ ] `locale/es/LC_MESSAGES/django.po` - Spanish translations
- [ ] All serializers - Translate error messages
- [ ] All views - Detect and apply language
- [ ] Create custom language middleware (optional)

---

## 14. Next Steps

1. **Review this plan** with the team
2. **Prioritize languages** based on user base
3. **Set up translation workflow** (tools, reviewers)
4. **Start Phase 1** (Foundation)
5. **Create translation keys** for English first
6. **Implement language switcher** early for testing
7. **Iterate** through phases systematically

---

## 15. Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Django i18n Documentation](https://docs.djangoproject.com/en/stable/topics/i18n/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [Translation Best Practices](https://phrase.com/blog/posts/translation-best-practices/)

---

**End of Document**

