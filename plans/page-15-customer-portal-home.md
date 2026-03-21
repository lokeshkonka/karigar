# Page 15: Customer Portal Home (/portal/home)

## 1. Overview
- **Path:** `/portal/home`
- **Purpose:** Consumer-facing landing dashboard for clients to see their car status, book new jobs.

## 2. UI/UX Requirements
- **Layout:** Mobile-optimized, bottom tab bar. Clean neubrutalism.
- **Active Job:** Massive tracker stepper (5 stages), countdown. Live cost estimate.
- **Vehicles List:** Cards linking to Service History and 3D Viewers.

## 3. Data Entities
- **Customer Vehicles & Active Orders.**

## 4. API & State Requirements
- **Realtime:** Customers see their job stage change the second the mechanic clicks 'Update' on their dashboard.

## 5. Security & Access Control
- **Row Level Security (RLS) / Scoping:** MongoDB Queries MUST strictly append `{ owner_id: current_user.id }` to every read request to prevent insecure direct object reference (IDOR).
- **Rate Limits:** Prevent users from brute forcing or scraping other users' cars.
