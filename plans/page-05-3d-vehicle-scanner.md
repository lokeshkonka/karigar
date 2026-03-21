# Page 5: 3D Vehicle Scanner (/scan/:vehicleId)

## 1. Overview
- **Path:** `/scan/:vehicleId`
- **Purpose:** Camera-driven full-screen UI to capture photogrammetry data (images) to construct/map 3D models.

## 2. UI/UX Requirements
- **Layout:** Full screen, dark mode (`#0a0a0a`). Live camera feed behind a UI wrapper.
- **Overlays:** Wireframe car outline for alignment. Progress arc indicating photo count (e.g. 12/36). Animation directional arrows guiding the user around the vehicle.
- **Buttons:** Giant yellow circular capture button with neubrutalism strokes.
- **Processing State:** "ANALYZING PHOTOS..." progress animation.

## 3. Data & APIs
- **Storage:** Upload batch of 36 images to object storage.
- **Processing API:** Forward images to a mesh generation pipeline (or pseudo-generate a texture mapped sphere for Tier 1 MVP). Save `.glb` result to DB.

## 4. Security & Access Control
- **Permissions:** WebRTC / `navigator.mediaDevices.getUserMedia` requires HTTPS and explicit user consent.
- **Bandwidth/Upload:** Rate limiting and payload size limits on batch uploads.
- **Access:** Only staff (OWNER/MANAGER/TECHNICIAN) and potentially CUSTOMER for their own car. Check `garage_id / owner_id`.
