# Page 6: Customers & CRM (/admin/customers)

## 1. Overview
- **Path:** `/admin/customers`
- **Purpose:** Customer relationship management, tracking loyalty, past visits, lifetime value, and direct contact.

## 2. UI/UX Requirements
- **Table:** Standard grid. Avatar initials, Name, Phone, Lifetime Spend, Loyalty Tier Badge (BRONZE/SILVER/GOLD colored).
- **Detail View:** Tabs for Profile, Vehicles, Job History, Invoices, Reviews, Internal Notes. Let managers add private notes.

## 3. Data Entities
- **Profiles (Customers):** Aggregate total spend derived from Paid `Invoices`.
- **Loyalty Tiers:** Derived natively or cached based on spend ranges.

## 4. API & State Requirements
- **Integrations:** 'Click to call', WhatsApp API deep-linking `wa.me/phone`.
- **Calculations:** Real-time metrics calculations (lifetime value, average rating).

## 5. Security & Access Control
- **Authorization:** Restrict TECHNICIAN from viewing CRMs. OWNER/MANAGER only.
- **Privacy (PII):** Customer phone and email are PII. Must encrypt at rest in MongoDB. Redis caches should obscure or omit PII where possible.
