# Page 10: Garage 3D Map (/admin/garage-map)

## 1. Overview
- **Path:** `/admin/garage-map`
- **Purpose:** Real-time spatial visualization of the workshop.

## 2. UI/UX Requirements
- **Canvas:** Three.js Top-down/Isometric. 
- **Bays:** Rectangular platforms. Green (Empty), Yellow (Occupied), Red (Overdue).
- **Interactivity:** Click bay -> camera pans -> Floating UI panel shows vehicle info and timer.

## 3. Data Entities
- **Garage Config:** Layout array stored in DB defining coordinates, sizes of bays.
- **Live State:** Aggregate of active `work_orders` assigned to bays.

## 4. API & State Requirements
- **Realtime:** Supabase Realtime / Socket.io feeding live state to Three.js canvas. If a technician updates a car to 'Ready', the bay tile changes color instantly.

## 5. Security & Access Control
- **View Access:** OWNER/MANAGER. Read-only simplified variant could be shown to CUSTOMER (see Page 15).
