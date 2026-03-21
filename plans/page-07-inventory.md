# Page 7: Inventory (/admin/inventory)

## 1. Overview
- **Path:** `/admin/inventory`
- **Purpose:** Manage spare parts, stock alerts, supplier orders, and track most-used items.

## 2. UI/UX Requirements
- **KPI Summary:** Total SKUs, Total Value, Low Stock (orange), Out of Stock (red heartbeat).
- **Grid/Table Views:** Color-coded border indicators for stock health.
- **Reorder Modal:** Auto-calculated suggested quantities based on consumption algorithms.

## 3. Data Entities
- **Parts:** Number, Name, Supplier, Cost, Sell Price, Threshholds.
- **Purchase Orders:** Track restocks.

## 4. API & State Requirements
- **Cron Jobs / Triggers:** When `job_parts` are attached to completed jobs, deduct `stock_count` automatically.
- **Usage Analytics:** Aggregate top 10 parts query over the last 30 days.

## 5. Security & Access Control
- **Financial Details:** Cost price and Suppliers might be hidden from TECHNICIAN.
- **Validation:** Disregard negative stock counts. Strict decrement logic using atomic DB operations (`$inc: -qty`) to prevent overselling race conditions.
