# Page 1: Authentication (/login & /register)

## 1. Overview
- **Paths:** `/login`, `/register`
- **Purpose:** Entry point for all users. Handles login, customer registration, OTP, and role-based redirection.

## 2. UI/UX Requirements (Neubrutalism)
- **Background:** `#F5F0E8`
- **Layout:** Centered login card, `3px` black border, `4px 4px 0px #1a1a1a` shadow.
- **Header:** GarageOS logo top center in `#FFE500` on a black strip.
- **Typography:** Bold headline "SIGN IN TO YOUR GARAGE" (weight 900, uppercase).
- **Inputs:** `3px` black border, `0px` border-radius.
- **Buttons:** `#FFE500` bg, `3px` solid `#1a1a1a` border, `3px 3px 0 #1a1a1a` shadow. Hover transforms.
- **Components:** Toggle between Email/Password and OTP via phone. Google Auth button.

## 3. Data Entities (MongoDB / Supabase Maps)
- **Profiles:** `User ID`, `Role`, `Name`, `Phone`, `Email`.
- **Vehicles:** `Plate`, `Make`, `Model`, `Year`, `Fuel Type`.

## 4. API & State Requirements
- **Zustand:** `useAuthStore` (token, user data, role).
- **Endpoints:** `/api/auth/login`, `/api/auth/register`, `/api/auth/otp`.

## 5. Security & Access Control
- **Role Verification:** On successful login, immediately route based on `role` (OWNER/MANAGER -> `/admin/dashboard`, TECHNICIAN -> `/staff/dashboard`, CUSTOMER -> `/portal/home`).
- **Validation:** Zod schemas for all forms.
- **Rate Limiting (Redis):** Throttle OTP and failed login attempts.
