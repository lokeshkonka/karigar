# Page 4: Vehicles (/admin/vehicles & /admin/vehicles/:id)

## 1. Overview
- **Path:** `/admin/vehicles` and `/admin/vehicles/:id`
- **Purpose:** List all vehicles serviced, detailed spec overview, service history, and linked 3D Model/Scans.

## 2. UI/UX Requirements
- **Listing:** Search/filters. Grid of vehicle cards with standard Neubrutalism styling.
- **Detail Tabs:** Overview | Service History | 3D Model | Documents.
- **3D Viewer Component:** Embed Three.js canvas. Rotate/Zoom/Pan. Hotspot markers.
- **Scanner Hook:** Button "Open Scanner" leads to `/scan/:vehicleId`.

## 3. Data Entities
- **Vehicles:** VIN, Engine, Transmission, Color.
- **Job History:** Past services.
- **Documents:** Registration, Insurance.

## 4. API & State Requirements
- **Endpoints:** Fetch paginated vehicles, upload vehicle documents to Storage, fetch external GLB/GLTF models.
- **Caching:** Redis cache vehicle overview to handle fast repeated loads.

## 5. Security & Access Control
- **Authorization:** OWNER/MANAGER access all garage vehicles. 
- **Storage Policy:** Vehicle documents (Insurance/PUC) in restricted buckets, access limited to authorized garage staff and owner.
- **Data Sanitization:** Strip EXIF metadata from uploaded document images.
