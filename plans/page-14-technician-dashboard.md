# Page 14: Technician Dashboard (/staff/dashboard)

## 1. Overview
- **Path:** `/staff/dashboard`
- **Purpose:** Focused, simplified execution view tailored for technicians on shop floor tablets.

## 2. UI/UX Requirements
- **Mobile First:** Big buttons ("START JOB", "COMPLETE JOB").
- **Job Cards:** High contrast, minimal text. NO customer PII.
- **Inputs:** Upload photo buttons, select parts used.

## 3. Data Entities
- **Work Orders:** Filtered exclusively `WHERE technician_id = current_user.id`.

## 4. API & State Requirements
- **Realtime:** Instant alerts if a new priority job is assigned to them.
- **Offline Support (Optional):** Service worker caching in case of poor Wi-Fi in the bay.

## 5. Security & Access Control
- **Authorization:** Only role `TECHNICIAN`.
- **Data Privacy:** Customer phone, email, full names (strip to first name only), and financial cost prices are aggressively filtered out of the API responses to the technician role.
