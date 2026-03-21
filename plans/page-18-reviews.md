# Page 18: Reviews (/portal/reviews)

## 1. Overview
- **Path:** `/portal/reviews`
- **Purpose:** Post-service feedback loop.

## 2. UI/UX Requirements
- **Form:** 5 massive yellow stars. Text area. Submit.
- **History:** List of past reviews given, along with any replies from management.

## 3. Data Entities
- **Reviews.**

## 4. API & State Requirements
- **Endpoints:** `POST /api/reviews` linked strictly to a completed Job ID to prevent fake spam reviews.

## 5. Security & Access Control
- **Validation:** User can only review a job that is completely 'DELIVERED'. Max 1 review per job. 
