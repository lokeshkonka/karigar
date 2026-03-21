# Page 2: Owner/Manager Dashboard (/admin/dashboard)

## 1. Overview
- **Path:** `/admin/dashboard`
- **Purpose:** Main hub for Garage Owners/Managers. Displays KPIs, Charts, Active Work Orders, Inventory Alerts, Review widgets, and Garage Bay status.

## 2. UI/UX Requirements
- **Layout:** 220px fixed left sidebar (`#1a1a1a` bg, white text, active nav item gets `#FFE500` left border and text) + Main content area.
- **KPI Row:** 4 metric cards. 3px black border, 4px shadow, bold metrics, colored bottom strips (green/blue/yellow/red).
- **Charts Row:** Bar chart for Weekly Revenue, Horizontal bar chart for Jobs by Type. Styled with Recharts (2px black borders on bars, `#FFE500` fill).
- **Tables:** Active Work Orders (Neubrutalism alternating rows `#ffffff` / `#F5F0E8`, 2px row borders). Status badges (WAITING, IN PROGRESS, etc.).
- **Garage Bay Grid:** Visual grid of 6 bays (empty=green, occupied=yellow, overdue=red heartbeat).

## 3. Data Entities
- **Work Orders, Vehicles, Customers, Invoices, Parts, Reviews.**

## 4. API & State Requirements
- **Endpoints:** `/api/dashboard/stats` (Redis cached for fast KPI load).
- **Realtime:** Listen to Work Order status changes to update Bay Grid live.

## 5. Security & Access Control
- **Authorization:** `PermissionGuard` requires `role === 'OWNER'` or `role === 'MANAGER'`.
- **Visibility:** Hide Revenue charts and Staff management from MANAGER if specific owner-only toggles apply.
- **Data Encapsulation:** Only fetch stats for `garage_id == current_user.garage_id`.
