# FoodShare MERN + REST + Computer Vision — Project Summary (as of Dec 6, 2025)

## 1. Project Overview
- FoodShare is a MERN web platform that connects donors, NGOs/receivers, and volunteers to redistribute surplus food safely and efficiently.
- Solves food waste + redistribution by enabling trusted posting, approval, claiming, volunteer assignment, and delivery tracking.
- Tech stack: MongoDB + Mongoose, Express.js/Node.js REST API, React frontend (Tailwind), Socket.io for realtime, Cloudinary for image storage, JWT auth with refresh, security middleware.
- CV integration: Python Flask microservice with TensorFlow MobileNetV2 + freshness classifier to classify food images, detect non-food cases, and estimate freshness/portion.

## 2. Features Implemented Till Now
- Authentication: JWT access + refresh tokens, email verification OTP, password reset/change OTP, Google OAuth, account lockout, logout, profile updates.
- Roles & permissions: user (donor/receiver), volunteer, admin; role-based authorization and admin-only endpoints.
- Food lifecycle: create/update/delete posts, images via Cloudinary URLs, location/pickup windows, dietary flags, expiry tracking, view counts, soft delete for users, hard delete for admins.
- Claiming & completion: claim flow prevents self-claim; completion updates status; cron auto-expires posts past pickup/expiry.
- Approvals: pending/approved/rejected states; volunteer/admin approval endpoints; rejection reasons captured.
- Volunteer management: applications with review, manual/auto assignment, accept/reject assignment, collection/distribution status updates, distribution reports, available-volunteer lookup.
- REST API surface: auth, food (search, claim, stats, approvals, assignments, AI assess), upload, messages (conversations, messages, unread counts), communication (contact sharing, notifications, pickup scheduling, distribution reporting).
- Realtime & comms: Socket.io rooms per user/role/conversation, typing indicators, unread counters; email notifications for claims, approvals, assignments, coordination, distribution completion.
- CV endpoints: `/api/food/assess-quality`, AI health/model status, admin test endpoint; non-food detection and freshness analysis returned to frontend.
- Database schemas: `User` (roles, OAuth, security tokens, volunteer application), `Food` (statuses, approval, location, dietary, expiry), `VolunteerAssignment` (assignment lifecycle, distribution details), messaging models for chat.
- Admin modules: user CRUD, food approvals, stats, volunteer applications review, AI model status checks, assignment management.
- Tooling/startup: npm scripts for full stack, Windows batch helpers for backend+AI, health endpoints for API/AI, service tests script.

## 3. Technical Work Completed
- API design & structure: modular routes/controllers/models/middleware/services; RESTful `/api/*`; health check in `server.js`.
- Middleware & security: helmet CSP, rate limiting (global + auth/password), CORS allowlist with credentials, cookie parser, JSON/urlencoded limits, mongo-sanitize, xss-clean, hpp, validation layer.
- Error handling: centralized error middleware with `ErrorResponse`; consistent `next(err)` flows and descriptive messages.
- Database modeling: indexed schemas for common queries; pre-save expiry check on food; login attempt tracking + lockout; volunteer application state; unread counters; view increments.
- Third-party libs: Express, Mongoose, Socket.io, Cloudinary SDK, Axios (service calls), Nodemailer-based email service, cron, security middleware suite; Python side uses Flask, TensorFlow/Keras, OpenCV, scikit-learn, joblib.
- CV pipeline: MobileNetV2 (ImageNet) ensemble predictions, freshness classifier, texture/color/edge analysis, portion estimation, non-food object detection; base64 intake; health/model status endpoints exposed to Node.
- Operational hardening: env-based rate limits, refresh-token rotation fields, Cloudinary cleanup on image replacement, pagination on food/messages, cron to expire posts, health endpoints for API/AI.

## 4. Current Architecture Diagram (ASCII)
```
[React SPA] --HTTPS--> [Node/Express REST + Socket.io] --MongoDB
      |                          | \
      |                          |  \--Cloudinary (media)
      |                          \--> Python CV (Flask/TensorFlow)
      |                                   |
   WebSockets <----------------------------/
```

## 5. Challenges Faced & Solutions
- Auth abuse and security: added per-route rate limits, account lockout, email verification OTP, refresh rotation, strict CORS/CSP.
- Trust/quality of posts: approval workflow, expiry cron, claim/collection/distribution states, volunteer assignment checks.
- Media lifecycle: standardized Cloudinary URLs and purge old images on update/delete.
- CV robustness: ensemble MobileNetV2 + heuristics for freshness, non-food detection, and status endpoints; fallback classifier to avoid outages.
- Realtime coordination: Socket.io rooms for user/role/conversation, typing indicators, unread counters to keep chat reliable.
- Ops stability: health checks for API/AI, scripted startup/testing, environment-aware limits.

## 6. Pending / To-Do
- Features: richer dashboards, impact metrics, scheduling calendar, in-app notification center, multilingual support.
- UI/UX: smoother food form with AI autofill, mobile-first refinements, accessibility audit, clearer moderation cues.
- ML: train freshness classifier on real labeled data, expand categories, contamination/allergen checks, CPU/GPU performance tuning, model versioning.
- Deployment: CI/CD, containerization, secret management, production logging/metrics, CDN for assets.
- Testing/docs: broader integration/e2e coverage (auth, food flows, chat, AI), load testing, API docs completeness, AI benchmarking notes.

## 7. Summary
FoodShare now delivers a secure, role-aware MERN platform covering food donation posting, approval, claiming, volunteer orchestration, realtime chat, and AI-backed quality assessment via a Python CV service. Security middleware, robust models, and operational scripts are in place, positioning the project for research publication and the next phase of dataset-driven ML improvements, UI refinement, and production deployment.
