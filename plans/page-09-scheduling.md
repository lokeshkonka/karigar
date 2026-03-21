# Page 9: Scheduling (/admin/schedule)

## 1. Overview
- **Path:** `/admin/schedule`
- **Purpose:** Calendar interface for booking bays and technician time.

## 2. UI/UX Requirements
- **Calendar:** `react-big-calendar`. Neubrutalism styles overriding default CSS (thick borders, primary colors).
- **Drag-Drop:** Move appointments to different bays or times.
- **Modal:** Create booking flow with customer search auto-complete.

## 3. Data Entities
- **Appointments:** Start/End Time, Bay, Technician, Customer, Job Type.

## 4. API & State Requirements
- **Endpoints:** Range queries for fetching events in the visible month/week (`gte` / `lte` dates).
- **Public Link:** Endpoint to render public booking page for customers (`/book/:garage_slug`).

## 5. Security & Access Control
- **Public Booking:** Implement CAPTCHA or Redis rate limits on the public customer-facing booking endpoint to prevent spam bot bookings.
- **Overlap Prevention:** DB Constraint or application logic to prevent double-booking a bay or technician.
