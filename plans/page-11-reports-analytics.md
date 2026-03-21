# Page 11: Reports & Analytics (/admin/reports)

## 1. Overview
- **Path:** `/admin/reports`
- **Purpose:** Aggregation of revenue, operations, customer demographics, and staff performance.

## 2. UI/UX Requirements
- **Export Toolbar:** Date range + "Export All (Excel)" button.
- **Charts:** Extensive use of `Recharts`. Neobrutalist design: 2px borders on bars, sharp tooltips, bright accent colors.
- **Sections:** Revenue, Operations (Bay Heatmap), Customers, Inventory, Staff.

## 3. Data & Aggregations
- **MongoDB Pipelines:** Heavy use of MongoDB Aggregation framework to roll up daily/monthly revenue, bay utilization rates, and first-time fix rates.
- **Redis Cache:** Pre-compute overnight analytics for the past month to ensure instant load times.

## 4. Security & Access Control
- **Role-Based Views:** Staff Performance section strictly hidden from MANAGER if settings specify OWNER-only.
- **Computation Limits:** Date range limits (e.g., max 1 year per query) to prevent DoS attacks via massive DB aggregations.
