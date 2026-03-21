# Page 13: Settings (/admin/settings)

## 1. Overview
- **Path:** `/admin/settings`
- **Purpose:** Global configuration for the GarageOS tenant.

## 2. UI/UX Requirements
- **Tabs:** Garage Profile, Bays Config, Notifications, Integrations, Users & Roles.
- **Bays Config:** 2D Drag-and-drop grid editor to map out the garage.

## 3. Data Entities
- **Garage Object:** Contains keys for 3rd party config (API keys).

## 4. API & State Requirements
- **Third Party:** Razorpay keys, WhatsApp Business tokens, Google Calendar Webhooks.

## 5. Security & Access Control
- **Encryption:** IMPORTANT - All API keys (Razorpay Secret, WhatsApp Token) must be encrypted at rest in the DB using AES-256 and only decrypted on the server when needed. They should **never** be sent to the front-end.
- **Access:** OWNER only.
