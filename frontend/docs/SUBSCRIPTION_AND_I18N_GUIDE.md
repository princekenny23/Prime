# PrimePOS SaaS Implementation Guide
## Subscription Plans & Internationalization (i18n)

---

## Part 1: Subscription Plans Implementation

### Overview

Subscription plans allow you to monetize your SaaS by offering tiered features. PrimePOS will have three tiers: Basic, Standard, and Advanced.

---

### Plan Structure

#### Basic Plan
- **Target:** Small businesses, startups, individual sellers
- **Outlets:** 1 outlet only
- **Users:** Up to 3 users
- **Products:** Up to 500 products
- **Features:** Core POS functionality, basic reports, cash payments only
- **Support:** Email support only
- **Price:** Free or low-cost entry tier

#### Standard Plan
- **Target:** Growing businesses, small chains
- **Outlets:** Up to 3 outlets
- **Users:** Up to 10 users
- **Products:** Up to 5,000 products
- **Features:** All Basic features plus inventory management, customer management, multiple payment methods, advanced reports, quotations
- **Support:** Email and chat support
- **Price:** Mid-tier monthly/annual subscription

#### Advanced Plan
- **Target:** Large businesses, franchises, enterprises
- **Outlets:** Unlimited outlets
- **Users:** Unlimited users
- **Products:** Unlimited products
- **Features:** All Standard features plus multi-outlet analytics, API access, custom integrations, white-labeling, priority support, dedicated account manager
- **Support:** 24/7 phone, email, and chat support
- **Price:** Premium tier with custom pricing options

---

### Backend Implementation Steps

1. **Create Plan Model**
   - Store plan details: name, price, billing cycle, feature limits
   - Define feature flags for each plan capability

2. **Create Subscription Model**
   - Link tenant to their active plan
   - Track subscription status (active, cancelled, expired, trial)
   - Store billing dates, payment history, and renewal information

3. **Create Feature Limit Model**
   - Define numerical limits: max outlets, max users, max products
   - Define boolean features: has_api_access, has_multi_outlet, has_advanced_reports

4. **Implement Plan Middleware**
   - Check user's current plan before allowing actions
   - Return appropriate errors when limits are exceeded
   - Gracefully handle plan downgrades

5. **Create Billing Integration**
   - Integrate with payment gateway (Stripe recommended for international, or local Malawi payment providers like Airtel Money, TNM Mpamba)
   - Handle subscription creation, updates, and cancellations
   - Manage failed payments and grace periods

6. **Add Usage Tracking**
   - Track current usage against plan limits
   - Store metrics: outlet count, user count, product count, transaction volume
   - Provide usage dashboards for tenants

---

### Frontend Implementation Steps

1. **Create Pricing Page**
   - Display all three plans with feature comparisons
   - Highlight recommended plan
   - Show monthly and annual pricing options

2. **Create Plan Selection Flow**
   - Guide new tenants through plan selection during signup
   - Allow plan upgrades/downgrades from settings

3. **Add Upgrade Prompts**
   - Show contextual upgrade prompts when users hit limits
   - Display remaining capacity warnings (e.g., "2 of 3 outlets used")

4. **Create Billing Dashboard**
   - Show current plan, next billing date, payment history
   - Allow payment method management
   - Provide invoice downloads

---

### Plan Enforcement Points

- **Outlet Creation:** Check max_outlets limit before allowing new outlet
- **User Invitation:** Check max_users limit before adding staff
- **Product Creation:** Check max_products limit before adding products
- **Feature Access:** Check feature flags before showing advanced features
- **API Requests:** Validate API access permission on all API endpoints

---

## Part 2: Internationalization (i18n) Implementation

### Overview

i18n allows PrimePOS to support multiple languages. We will start with English (default) and Chichewa (for Malawi market).

---

### Language Support Strategy

#### Supported Languages
1. **English (en)** - Default language
2. **Chichewa (ny)** - Malawian national language (ISO 639-1 code: ny)

#### Future Languages to Consider
- Portuguese (for Mozambique)
- French (for regional expansion)
- Swahili (for East Africa expansion)

---

### Translation Scope

#### User Interface Elements
- Navigation labels and menu items
- Button text and action labels
- Form labels and placeholders
- Error messages and validation text
- Success and confirmation messages
- Empty state messages

#### Business Terms
- Product categories and types
- Payment methods
- Receipt and invoice text
- Report headings and labels
- Dashboard metrics

#### Date and Number Formatting
- Date formats (Malawi uses DD/MM/YYYY)
- Currency formatting (MWK - Malawian Kwacha)
- Number separators (thousands, decimals)

---

### Frontend Implementation Steps

1. **Install i18n Library**
   - Use next-intl (recommended for Next.js App Router)
   - Alternative: next-i18next for Pages Router

2. **Create Translation Files Structure**
   - Create locale folders: /locales/en/, /locales/ny/
   - Organize by feature: common.json, dashboard.json, pos.json, settings.json

3. **Implement Translation Provider**
   - Wrap application with i18n provider
   - Detect user's preferred language from browser or saved preference

4. **Create Language Switcher Component**
   - Add to header or settings page
   - Save language preference to user profile
   - Persist across sessions

5. **Translate All Static Text**
   - Replace hardcoded strings with translation keys
   - Use interpolation for dynamic values
   - Handle pluralization rules

---

### Chichewa Translation Guidelines

#### Common POS Terms in Chichewa
- Dashboard → Gawo Lalikulu
- Sales → Malonda
- Products → Zinthu
- Customers → Makasitomala
- Inventory → Katundu
- Reports → Malipoti
- Settings → Zokonzekera
- Logout → Tulukani
- Search → Sakani
- Add → Onjezani
- Edit → Sinthani
- Delete → Chotsani
- Save → Sungani
- Cancel → Lekani
- Confirm → Tsimikizani
- Total → Chiwerengero Chonse
- Price → Mtengo
- Quantity → Kuchuluka
- Receipt → Risiti
- Payment → Malipiro
- Cash → Ndalama
- Change → Chenjiyo

#### Translation Best Practices
- Use formal Chichewa for business context
- Keep translations concise for UI buttons
- Test with native Chichewa speakers
- Consider regional variations within Malawi
- Maintain consistency across the application

---

### Backend Considerations

1. **Store User Language Preference**
   - Add language field to User model
   - Default to English for new users

2. **Localize Backend Messages**
   - Translate API error messages
   - Localize email notifications
   - Format dates and numbers based on locale

3. **Localize Receipts and Documents**
   - Generate receipts in customer's preferred language
   - Support bilingual receipts if needed

---

### Testing i18n Implementation

1. **Missing Translation Detection**
   - Configure fallback to English for missing keys
   - Log missing translations in development

2. **Layout Testing**
   - Test UI with longer Chichewa translations
   - Ensure buttons and labels don't overflow
   - Check responsive design with different text lengths

3. **Right-to-Left (RTL) Preparation**
   - Not needed for Chichewa (LTR language)
   - But consider architecture for future Arabic support

---

## Implementation Priority

### Phase 1: Foundation
1. Create database models for plans and subscriptions
2. Set up i18n library and English translations
3. Build pricing page with plan comparison

### Phase 2: Core Features
1. Implement plan limit enforcement
2. Complete Chichewa translations for main flows
3. Add language switcher to settings

### Phase 3: Payment Integration
1. Integrate payment gateway
2. Build subscription management UI
3. Implement billing notifications

### Phase 4: Polish
1. Add usage analytics dashboard
2. Complete all Chichewa translations
3. Implement upgrade/downgrade flows
4. Add trial period functionality

---

## Technical Dependencies

### Subscription Plans
- Payment gateway SDK (Stripe, PayPal, or local provider)
- Scheduled job system for subscription checks
- Email service for billing notifications

### Internationalization
- next-intl package for Next.js
- Translation management tool (optional: Crowdin, Lokalise)
- Native speaker review for Chichewa accuracy

---

## Success Metrics

### Subscription Plans
- Conversion rate from free to paid plans
- Average revenue per user (ARPU)
- Churn rate by plan tier
- Upgrade rate from Basic to Standard/Advanced

### Internationalization
- Percentage of users using Chichewa
- Support ticket reduction for Chichewa users
- User satisfaction scores by language
- Onboarding completion rate by language

---

## Notes

- Start with a generous free tier to attract users
- Consider annual discount (e.g., 20% off) for yearly subscriptions
- Partner with local Malawian translators for accurate Chichewa
- Plan for offline functionality important in Malawi market
- Consider mobile money integration for local payments


