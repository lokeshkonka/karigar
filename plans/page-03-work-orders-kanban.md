# Page 3: Work Orders Kanban (/admin/jobs)

## 1. Overview
- **Path:** `/admin/jobs` and `/admin/jobs/:id`
- **Purpose:** Manage active jobs visually using a Kanban board and view detailed job information.

## 2. UI/UX Requirements
- **Kanban Board:** Horizontally scrollable columns (`WAITING` -> `DIAGNOSED` -> `IN PROGRESS` -> `QUALITY CHECK` -> `READY` -> `DELIVERED`).
- **Cards:** White bg, 3px border. Status badges, Vehicle plate (black bg, yellow text monospace), Priority badges. Overdue cards get an animated red 3px border.
- **Detail View:** 60/40 Split Panel. 
  - Left panel: Vehicle info, Formatted description, Parts Table, Labor breakdown, Photo grid.
  - Right panel: Assignment dropdown, Priority selector, Notification buttons.

## 3. Data Entities
- **Work Orders:** Status, assigned technician, priority, estimates.
- **Job Parts:** linked items used.
- **Job Photos:** Before/After evidence.

## 4. API & State Requirements
- **Drag & Drop:** `react-beautiful-dnd` or `@hello-pangea/dnd` trigger `PATCH /api/jobs/:id/status`.
- **State:** `useJobStore` for tracking column state and optimistic UI updates.
- **Calculations:** Auto-calculating sum of `Parts` + `Labor` - `Discounts`.

## 5. Security & Access Control
- **Authorization:** OWNER/MANAGER access.
- **Concurrency Control:** Use optimistic locking or real-time broadcast to prevent two managers updating the same card simultaneously.
- **Audit Logging:** Every status drag-drop logs to `job_status_history`.
