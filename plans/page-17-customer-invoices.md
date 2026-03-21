# Page 17: Customer Invoices (/portal/invoices)

## 1. Overview
- **Path:** `/portal/invoices`
- **Purpose:** Financial history and online payment interface for the customer.

## 2. UI/UX Requirements
- **List:** Badges for PAID/PENDING.
- **Payment Flow:** Integrate Razorpay JS Checkout. Modal popup.

## 3. Data Entities
- **Invoices, Payments.**

## 4. API & State Requirements
- **Webhooks:** Secure endpoint (`/api/webhooks/razorpay`) to receive payment confirmations and update database automatically.

## 5. Security & Access Control
- **Payment Security:** Signature verification of Razorpay webhooks crypto using secret key.
- **Idempotency:** Prevent double-processing of the same payment event.
