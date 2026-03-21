# Page 8: Invoicing (/admin/invoices)

## 1. Overview
- **Path:** `/admin/invoices` and `/admin/invoices/:id`
- **Purpose:** Billing engine. Print styled invoices, track paid/unpaid status, integrated payment capturing.

## 2. UI/UX Requirements
- **Editor:** Rendered to look exactly like the physical printout. Neubrutalist bold borders. Grand total highlighted in a giant yellow box.
- **Actions:** "Download PDF" (html2canvas+jsPDF), Send Via Email/SMS.
- **Payment Modal:** Log partial/full payments.

## 3. Data Entities
- **Invoices:** Subtotal, GST (18%), Discount, Grand Total, Status (DRAFT/SENT/PAID/OVERDUE).
- **Payments:** Array of payment records with transaction IDs.

## 4. API & State Requirements
- **Gateway:** Razorpay SDK integration for online payments.
- **Generation:** Generate unique predictable sequential invoice numbers (`INV-2024-001`). Handle concurrency.

## 5. Security & Access Control
- **Concurrency:** Transactional guarantees when multiple managers attempt to mark an invoice paid or generate invoice numbers.
- **Tampering:** Once PAID, invoice lines become strictly read-only and immutable.
