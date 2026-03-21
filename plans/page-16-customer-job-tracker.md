# Page 16: Customer Job Tracker (/portal/jobs/:id)

## 1. Overview
- **Path:** `/portal/jobs/:id`
- **Purpose:** The detailed, interactive live feed of their current service.

## 2. UI/UX Requirements
- **Tracker:** Vertical timeline, Mechanic Avatar, Photo carousels (Before/During).
- **Chat Interface:** Simple messenger interface for direct queries to the garage.
- **End State:** Confetti animation on completion + Rating prompt.

## 3. Data Entities
- **Status History, Messages, Job Photos.**

## 4. API & State Requirements
- **Messages API:** Realtime WebSocket connection for chat.

## 5. Security & Access Control
- **Authorization:** Validate customer owns the job ID.
- **Photo Privacy:** Ensure uploaded photos do not inadvertently leak other customers' data (handled process-wise, but technically rely on secure storage paths).
