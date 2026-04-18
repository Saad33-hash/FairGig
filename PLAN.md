# FairGig — Master Implementation Plan
> **Hackathon state doc. Any AI agent reading this must treat it as ground truth for what is done, what is next, and what decisions have been made.**

---

## Project Overview
FairGig empowers gig workers (riders, delivery, freelancers) in Pakistan to log, verify, and understand earnings across platforms. Labour advocates get aggregate analytics to spot systemic unfairness.

**Stack:**
- Frontend: React 19 + Vite + Tailwind CSS v4 (`Client/`)
- Auth + Earnings + Grievance services: Node.js/Express (`Server/`)
- Anomaly Detection + Analytics: Python FastAPI (separate folders, TBD)
- Database: MongoDB (single instance, separate collections per domain)
- File uploads: Multer (local disk, `Server/uploads/`)

---

## Service Architecture

| Service | Tech | Port | Folder | Status |
|---|---|---|---|---|
| Auth Service | Node.js/Express | 5000 | `Server/` | PARTIAL |
| Earnings Service | Node.js/Express | 5001 | `Server/` (same process, separate router) | NOT STARTED |
| Grievance Service | Node.js (required) | 5002 | `Server/` (same process, separate router) | NOT STARTED |
| Certificate Renderer | Node.js | 5003 | `Server/` (same process, separate router) | NOT STARTED |
| Anomaly Detection | Python FastAPI (required) | 8000 | `anomaly-service/` | NOT STARTED |
| Analytics Service | Python FastAPI (required - 2nd FastAPI) | 8001 | `analytics-service/` | NOT STARTED |
| Frontend | React/Vite | 5173 | `Client/` | PARTIAL |

> **NOTE:** The Node.js services can all live in the same Express app (`Server/`) with logically separated routers. This satisfies "logically separated with clear REST API boundaries" without needing 4 separate Node processes. The two FastAPI services MUST be separate Python processes.

---

## User Roles
Three roles: `worker`, `verifier`, `advocate`
- **Worker**: logs shifts, uploads screenshots, views own analytics, generates certificate
- **Verifier**: reviews screenshot submissions, confirms/flags/marks unverifiable
- **Advocate**: reads aggregate analytics panel, moderates grievance board

---

## Database Schema (MongoDB)

### Collection: `users`
```
_id, firstName, lastName, email, password, provider, providerId,
avatar, isVerified, verificationToken, verificationTokenExpiresAt,
role: { type: String, enum: ['worker','verifier','advocate'], default: 'worker' },
city: String,           // for city-wide median grouping
category: String,       // 'ride-hailing' | 'food-delivery' | 'freelance' | 'domestic'
timestamps
```
> **CHANGE NEEDED:** Add `role`, `city`, `category` fields to existing `Server/models/User.js`

---

### Collection: `shifts`
```
_id,
workerId: ObjectId → users,
platform: String,       // 'Careem' | 'Bykea' | 'Foodpanda' | 'Upwork' | 'Other'
date: Date,
hoursWorked: Number,
grossEarned: Number,    // PKR
platformDeductions: Number,
netReceived: Number,    // grossEarned - platformDeductions
city: String,
category: String,
screenshotId: ObjectId → screenshots (nullable),
verificationStatus: { type: String, enum: ['unsubmitted','pending','verified','flagged','unverifiable'], default: 'unsubmitted' },
anomalyFlag: Boolean,   // set by anomaly service
timestamps
```

---

### Collection: `screenshots`
```
_id,
workerId: ObjectId → users,
shiftId: ObjectId → shifts,
filePath: String,       // local disk path under Server/uploads/
originalName: String,
mimeType: String,
verifierId: ObjectId → users (nullable),
status: { type: String, enum: ['pending','verified','flagged','unverifiable'], default: 'pending' },
verifierNote: String,
reviewedAt: Date,
timestamps
```

---

### Collection: `grievances`
```
_id,
workerId: ObjectId → users (nullable — anonymous allowed),
platform: String,
category: String,       // 'commission-change' | 'deactivation' | 'payment-delay' | 'other'
description: String,
tags: [String],
status: { type: String, enum: ['open','escalated','resolved'], default: 'open' },
advocateId: ObjectId → users (nullable),
advocateNote: String,
clusterGroup: String,   // set by advocate when clustering similar complaints
timestamps
```

---

## Feature Implementation Plan

### PHASE 1 — Foundation (Auth + Role System)
**Status: COMPLETE**

#### What's done:
- `Server/models/User.js` — added `role`, `city`, `category` fields
- `Server/controllers/authController.js` — `role` in JWT, signup validates role/city/category, `serializeUser` helper returns all fields, `/me` returns role
- `Server/middleware/authMiddleware.js` — added `requireRole(...roles)` named export
- `Server/config/passport.js` — GitHub removed, Google only
- `Client/src/pages/SignupPage.jsx` — role card selector, city dropdown, category dropdown (worker-only)
- `Client/src/components/ProtectedRoute.jsx` — `allowedRoles` prop, redirects to role home if wrong role
- `Client/src/components/Navbar.jsx` — FairGig branding, role badge, role-specific nav links
- `Client/src/App.jsx` — full role-based routing with `RoleRedirect`
- `Client/src/App.css` — role card styles, role badge colours, placeholder page styles, nav link styles
- Placeholder pages created: `WorkerDashboardPage`, `EarningsPage`, `CertificatePage`, `VerifierQueuePage`, `AdvocateDashboardPage`, `AdvocateModerationPage`, `GrievanceBoardPage`

---

### PHASE 2 — Earnings Logger
**Status: NOT STARTED**

#### Backend
- **Model:** `Server/models/Shift.js` (schema above)
- **Controller:** `Server/controllers/earningsController.js`
  - `POST /api/earnings/shifts` — log single shift
    - Input: `{ platform, date, hoursWorked, grossEarned, platformDeductions, city, category }`
    - Auto-compute `netReceived = grossEarned - platformDeductions`
    - Auth: worker only
  - `GET /api/earnings/shifts` — get own shifts (paginated, filterable by date range)
  - `PUT /api/earnings/shifts/:id` — edit own shift
  - `DELETE /api/earnings/shifts/:id` — delete own shift
  - `POST /api/earnings/shifts/csv-import` — bulk CSV upload
    - Uses `multer` for file, `csv-parse` npm package for parsing
    - Validate each row, insert valid rows, return summary of successes/failures
- **Route:** `Server/routes/earningsRoutes.js` → mounted at `/api/earnings`

#### Frontend
- `Client/src/pages/worker/EarningsPage.jsx`
  - Shift log table (date, platform, hours, gross, deductions, net, verification badge)
  - "Add Shift" button → modal/drawer form
  - "Import CSV" button → file upload
  - Filter by date range, platform

---

### PHASE 3 — Screenshot Verification Flow
**Status: NOT STARTED**

#### Backend
- **Model:** `Server/models/Screenshot.js`
- **Controller:** `Server/controllers/screenshotController.js`
  - `POST /api/earnings/shifts/:shiftId/screenshot` — worker uploads screenshot
    - Uses `multer`, saves to `Server/uploads/screenshots/`
    - Creates Screenshot doc, sets shift `verificationStatus = 'pending'`
    - Auth: worker only
  - `GET /api/verifier/queue` — verifier gets all pending screenshots
    - Returns screenshot + linked shift data
    - Auth: verifier only
  - `POST /api/verifier/screenshots/:id/review` — verifier submits decision
    - Input: `{ status: 'verified'|'flagged'|'unverifiable', note: String }`
    - Updates Screenshot doc + Shift `verificationStatus`
    - Auth: verifier only
  - `GET /api/earnings/shifts/:shiftId/screenshot` — get screenshot status for a shift

#### Frontend
- `Client/src/pages/worker/EarningsPage.jsx` — add upload button per shift row
- `Client/src/pages/verifier/VerifierQueuePage.jsx`
  - List of pending screenshots with image preview
  - Action buttons: Confirm / Flag Discrepancy / Mark Unverifiable
  - Note input field

---

### PHASE 4 — Anomaly Detection Service (Python FastAPI)
**Status: NOT STARTED**
**Folder:** `anomaly-service/`
**Port:** 8000

#### Files to create:
- `anomaly-service/main.py`
- `anomaly-service/requirements.txt` — `fastapi uvicorn numpy scipy`
- `anomaly-service/README.md`

#### API:
- `POST /detect` — main endpoint judges will call directly
  - Input:
    ```json
    {
      "worker_id": "string",
      "shifts": [
        {
          "date": "2025-01-15",
          "platform": "Careem",
          "gross_earned": 3000,
          "platform_deductions": 900,
          "net_received": 2100,
          "hours_worked": 8
        }
      ]
    }
    ```
  - Logic:
    1. Compute `effective_rate = platform_deductions / gross_earned` per shift
    2. Z-score deduction rates across shifts; flag if |z| > 2.0
    3. Compute monthly net totals; flag if month-on-month drop > 20%
    4. Compute hourly rate per shift; flag if hourly rate drops significantly
  - Output:
    ```json
    {
      "worker_id": "string",
      "anomalies": [
        {
          "shift_date": "2025-01-15",
          "type": "unusual_deduction",
          "severity": "high",
          "explanation": "Platform deducted 43% on this shift — your typical rate is 22%. This is 2.8 standard deviations above your average."
        }
      ],
      "summary": "2 anomalies detected in your recent earnings."
    }
    ```
- `GET /health` — health check

#### Node.js integration:
- `Server/controllers/earningsController.js` — after fetching shifts, call `http://localhost:8000/detect` and merge anomaly flags into response

---

### PHASE 5 — Worker Analytics Dashboard
**Status: NOT STARTED**

#### Backend (Node.js, same `Server/`)
- `GET /api/analytics/worker/summary` — worker's own stats
  - Weekly/monthly earnings chart data
  - Effective hourly rate over time
  - Commission rate per platform over time
  - Auth: worker only
- `GET /api/analytics/worker/city-median` — anonymised city-wide median
  - MongoDB aggregate: group by city + category, compute median net per month
  - MUST use real seeded data — seed script required
  - Returns `{ median_net_monthly: Number, percentile_of_worker: Number }`

#### Seeding:
- `Server/scripts/seed.js` — generate 200+ fake shifts across Lahore/Karachi/Islamabad, multiple platforms and categories

#### Frontend:
- `Client/src/pages/worker/DashboardPage.jsx`
  - Line chart: weekly/monthly earnings (use `recharts` npm package)
  - Bar chart: commission rate by platform
  - Stat cards: avg hourly rate, total this month, verified shifts count
  - City median comparison widget with percentile indicator

---

### PHASE 6 — Analytics Service (Python FastAPI — 2nd required)
**Status: NOT STARTED**
**Folder:** `analytics-service/`
**Port:** 8001

#### Files:
- `analytics-service/main.py`
- `analytics-service/requirements.txt` — `fastapi uvicorn pymongo python-dotenv`
- `analytics-service/README.md`

#### API:
- `GET /advocate/commission-trends` — commission rate per platform over time
  - Queries MongoDB `shifts` collection directly
- `GET /advocate/income-distribution` — income by city zone (histogram data)
- `GET /advocate/top-complaints` — top complaint categories this week (queries `grievances`)
- `GET /advocate/vulnerability-flags` — workers whose net income dropped >20% month-on-month
  - Returns anonymised list (no names, just worker_id + city + category + drop_pct)
- `GET /health`

> This service reads MongoDB directly using `pymongo`. The Node.js advocate analytics route proxies to this service.

---

### PHASE 7 — Grievance Board
**Status: NOT STARTED**

#### Backend (Node.js, `Server/`)
- **Model:** `Server/models/Grievance.js`
- **Controller:** `Server/controllers/grievanceController.js`
  - `POST /api/grievances` — post complaint
    - Input: `{ platform, category, description }` — workerId from JWT (or anonymous)
    - Auth: worker (or public if anonymous allowed)
  - `GET /api/grievances` — list all open grievances (paginated, filterable)
    - Auth: any authenticated user
  - `PUT /api/grievances/:id/tag` — advocate adds tags
    - Input: `{ tags: ['commission-change', 'Karachi'] }`
    - Auth: advocate only
  - `PUT /api/grievances/:id/cluster` — advocate sets cluster group
    - Input: `{ clusterGroup: 'Careem Commission Hike Jan 2025' }`
    - Auth: advocate only
  - `PUT /api/grievances/:id/status` — advocate updates status
    - Input: `{ status: 'escalated'|'resolved', advocateNote: String }`
    - Auth: advocate only

#### Frontend:
- `Client/src/pages/GrievanceBoardPage.jsx` — public bulletin board
  - Cards with platform, category, description, tags, status badge
  - "Post Complaint" button → modal form
  - Filter by platform, category, status
- `Client/src/pages/advocate/AdvocateModerationPage.jsx`
  - Same board but with tag/cluster/status action buttons per card

---

### PHASE 8 — Advocate Analytics Panel
**Status: NOT STARTED**

#### Frontend:
- `Client/src/pages/advocate/AdvocateDashboardPage.jsx`
  - Commission rate trends chart (calls Node.js → proxies to analytics-service)
  - Income distribution by city (bar/histogram chart)
  - Top complaint categories table
  - Vulnerability flags table (anonymised)

---

### PHASE 9 — Income Certificate
**Status: NOT STARTED**

#### Backend (Node.js, `Server/`)
- `GET /api/certificate/:workerId?from=DATE&to=DATE`
  - Fetches all verified shifts in date range for worker
  - Renders HTML using a template string (no external templating needed)
  - Returns `Content-Type: text/html` with `@media print` CSS
  - Auth: worker (own certificate only) or advocate
  - Certificate content:
    - Worker name, city, category
    - Date range
    - Table of verified shifts (date, platform, gross, deductions, net)
    - Total verified earnings
    - FairGig watermark + "This income summary is based on worker-reported and verifier-confirmed earnings"

#### Frontend:
- `Client/src/pages/worker/CertificatePage.jsx`
  - Date range picker
  - Preview iframe or new-tab link
  - Print button

---

## Frontend Route Map

```
/login                          → LoginPage (done)
/signup                         → SignupPage (needs role/city/category fields)
/oauth/callback                 → OAuthCallbackPage (done)

/app                            → redirect based on role:
  worker  → /app/worker/dashboard
  verifier → /app/verifier/queue
  advocate → /app/advocate/dashboard

/app/worker/dashboard           → WorkerDashboardPage (analytics)
/app/worker/earnings            → EarningsPage (shift logger)
/app/worker/certificate         → CertificatePage

/app/verifier/queue             → VerifierQueuePage

/app/advocate/dashboard         → AdvocateDashboardPage
/app/advocate/moderation        → AdvocateModerationPage

/app/grievances                 → GrievanceBoardPage (all roles)
```

---

## Additional npm Packages Needed

### Server (Node.js)
```
multer          — file upload (screenshots, CSV)
csv-parse       — parse CSV imports
axios           — call Python FastAPI services from Node
recharts        — (frontend) charts
```

### Client (React)
```
recharts        — charts (earnings trends, commission rates)
react-hook-form — form handling
date-fns        — date formatting
```

### anomaly-service (Python)
```
fastapi
uvicorn
numpy
scipy
```

### analytics-service (Python)
```
fastapi
uvicorn
pymongo
python-dotenv
```

---

## Inter-Service Communication

| Caller | Target | Method | Endpoint |
|---|---|---|---|
| Node.js Earnings | Anomaly Service | HTTP POST | `localhost:8000/detect` |
| Node.js Advocate Analytics | Analytics Service | HTTP GET | `localhost:8001/advocate/*` |
| Frontend | All Node.js | HTTP REST | `localhost:5000/api/*` |

---

## Seeding Strategy
- `Server/scripts/seed.js` — insert 200 fake shifts across:
  - Cities: Lahore, Karachi, Islamabad, Rawalpindi
  - Categories: ride-hailing, food-delivery, freelance, domestic
  - Platforms: Careem, Bykea, Foodpanda, Upwork, Other
  - Date range: last 6 months
  - Random deduction rates 15%–40% to simulate anomalies
- Must be run before demo: `node Server/scripts/seed.js`

---

## Implementation Order (Priority for Hackathon)
1. ✅ Phase 1 partial — fix User model (add role/city/category), update signup
2. Phase 2 — Earnings logger (core feature, everything depends on shifts data)
3. Phase 4 — Anomaly service (judges will call this directly — high visibility)
4. Phase 3 — Screenshot verification flow
5. Phase 7 — Grievance board
6. Phase 5 — Worker analytics dashboard + seeding
7. Phase 6 — Analytics service (FastAPI 2)
8. Phase 8 — Advocate analytics panel
9. Phase 9 — Income certificate
10. Polish: print CSS, responsive UI, postman collection docs

---

## Current State Snapshot (as of start)

### Done:
- Full auth flow: JWT signup/login/verify-email, Google OAuth, GitHub OAuth
- Protected routes on frontend
- Auth context + useAuth hook
- Tailwind v4 configured
- Axios instance with auth header injection

### NOT done (entire feature list):
- Role field on User (just add 3 fields to existing model)
- Shift logging
- Screenshot upload + verifier queue
- Anomaly detection Python service
- Analytics Python service  
- Grievance board
- Worker analytics dashboard
- Advocate analytics panel
- Income certificate
- City-wide median (requires seed data)
- All frontend pages except auth pages

### Decisions made:
- MongoDB for all services (single instance, separate collections)
- All Node.js services in same Express app (`Server/`) — logically separated routers
- Two separate Python FastAPI processes
- Local disk file storage (multer) — no S3/Cloudinary
- `recharts` for all charts
- Seeded fake data for city-wide median (not hardcoded values)
- JWT carries `role` in payload for fast role checks without DB lookup
