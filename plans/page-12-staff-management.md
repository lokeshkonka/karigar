# Page 12: Staff Management (/admin/staff)

## 1. Overview
- **Path:** `/admin/staff`
- **Purpose:** Owner-only view for tracking technician/manager performance, shifts, and salaries (optional).

## 2. UI/UX Requirements
- **List/Table:** Roster showing roles, specializations, active jobs, performance scores.
- **Detail Page:** Attendance schedule, salary config, assignment history.

## 3. Data Entities
- **Staff Profiles:** Linked to auth accounts.
- **Shifts:** `staff_shifts` tracking check-ins / assigned hours.

## 4. API & State Requirements
- **Endpoints:** CRUD for staff user creation (Supabase Admin API to create auth credentials without logging the owner out).

## 5. Security & Access Control
- **Strict Authorization:** `PermissionGuard(roles=['OWNER'])`.
- **Identity:** Manage JWT revocation if a staff member is terminated.
