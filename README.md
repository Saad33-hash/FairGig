# FairGig — Gig Worker Income & Rights Platform

> ## 🌐 Live Demo: [vircosa.com](https://vircosa.com)

FairGig is a full-stack platform built for Pakistan's gig economy. It gives workers a verifiable record of their earnings, detects exploitative commission patterns using statistical analysis, and provides advocates with aggregate labour intelligence — all without requiring cooperation from the platforms themselves.

Built for **SOFTEC 2026 Web Development Competition**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Vite + React 19)          │
│               http://localhost:5173                      │
└──────────────────────┬──────────────────────────────────┘
                       │ REST (JWT Bearer + httpOnly cookie)
┌──────────────────────▼──────────────────────────────────┐
│               Node.js / Express  (port 5000)            │
│  Auth · Earnings · Verifier · Analytics · Grievances    │
│  Income Certificates · Advocate proxy                   │
└────────┬──────────────────────────┬─────────────────────┘
         │ HTTP (internal)          │ HTTP (internal)
┌────────▼────────┐        ┌────────▼────────┐
│ anomaly-service │        │analytics-service│
│  FastAPI :8000  │        │  FastAPI :8001  │
│  Z-score engine │        │  MongoDB pivot  │
└─────────────────┘        └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   MongoDB Atlas  │
                           │  (shared DB)    │
                           └─────────────────┘
```

---

## Folder Structure

```
SOFTEC/
├── Client/                  # React 19 frontend (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/      # AuthLayout, Sidebar, Navbar, ProtectedRoute
│   │   ├── context/         # AuthContext (JWT + refresh interceptor)
│   │   ├── hooks/           # useAuth
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── OAuthCallbackPage.jsx
│   │   │   ├── DashboardPage.jsx      # role router
│   │   │   ├── GrievanceBoardPage.jsx # shared (all roles)
│   │   │   ├── worker/
│   │   │   │   ├── WorkerDashboardPage.jsx  # recharts analytics
│   │   │   │   ├── EarningsPage.jsx          # log + anomaly banner
│   │   │   │   └── CertificatePage.jsx       # HTML income certificate
│   │   │   ├── verifier/
│   │   │   │   └── VerifierQueuePage.jsx     # screenshot review queue
│   │   │   └── advocate/
│   │   │       ├── AdvocateDashboardPage.jsx # platform/city trends
│   │   │       └── AdvocateModerationPage.jsx # grievance moderation
│   │   └── utils/           # api.js (axios), notify.js (react-hot-toast)
│   └── package.json
│
├── Server/                  # Node.js + Express API
│   ├── controllers/         # auth, earnings, verifier, analytics,
│   │                        # grievance, certificate, advocate
│   ├── middleware/          # auth (JWT verify), roleGuard
│   ├── models/              # User, Shift, Grievance (Mongoose)
│   ├── routes/              # one file per domain
│   ├── scripts/
│   │   └── seed.js          # seeds 16 workers × ~16 shifts for demo
│   ├── uploads/             # multer disk storage for screenshots
│   └── index.js
│
├── anomaly-service/         # Python FastAPI — statistical anomaly detection
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── analytics-service/       # Python FastAPI — aggregate MongoDB analytics
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── API.md                   # Full inter-service API contract
└── README.md                # ← you are here
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 + |
| npm | 9 + |
| Python | 3.10 + |
| pip | any recent |
| MongoDB | Atlas (URI already in `.env`) |

---

## One-Time Setup

### 1 — Install dependencies

```bash
# Node server
cd Server && npm install

# React client
cd ../Client && npm install

# Python services (global or inside a venv)
cd ../anomaly-service  && pip install -r requirements.txt
cd ../analytics-service && pip install -r requirements.txt
```

### 2 — Environment files

`Server/.env` is already present with real credentials (MongoDB Atlas, Google OAuth, Gmail SMTP, JWT secrets). No changes needed for local development.

`anomaly-service/.env` and `analytics-service/.env` contain the same MongoDB URI — already configured.

### 3 — Seed the database

```bash
cd Server
node scripts/seed.js
```

This inserts **16 demo workers** (4 cities × 4 gig categories) with 15–20 shifts each (~256 shifts total). Seeding is idempotent — re-running it skips existing workers.

---

## Running All Services

Open **4 terminals** and run one command in each:

```bash
# Terminal 1 — Express API
cd Server && node index.js
# → http://localhost:5000

# Terminal 2 — React client
cd Client && npm run dev
# → http://localhost:5173

# Terminal 3 — Anomaly detection service
cd anomaly-service && uvicorn main:app --port 8000 --reload
# → http://localhost:8000

# Terminal 4 — Analytics service
cd analytics-service && uvicorn main:app --port 8001 --reload
# → http://localhost:8001
```

The Node server communicates with both Python services internally over HTTP. If either Python service is offline, the Node server degrades gracefully — earnings and advocate endpoints still respond, just without anomaly/analytics data.

---

## User Roles & Capabilities

### Gig Worker
Sign up with role **Gig Worker**, verify your email, then log in.

| Feature | How to use |
|---------|-----------|
| **Log a shift** | Earnings page → fill in platform, gross, deductions, hours, date → Submit |
| **Upload screenshot** | Attach a PNG/JPG/PDF proof when logging a shift |
| **Bulk CSV import** | Upload a `.csv` file with columns: `platform, grossEarning, deductions, hoursWorked, date` |
| **Anomaly alerts** | After logging shifts the page shows a yellow banner if your deductions look statistically unusual (Z-score > 2σ or income drop > 20 %) |
| **Analytics dashboard** | Worker Dashboard → monthly earnings line chart, per-platform commission bar chart, city-wide median comparison with your percentile |
| **Income certificate** | Certificate page → pick date range → Preview (renders HTML) → Print |
| **Grievance board** | Post complaints, view all open/escalated/resolved posts |

### Verifier
Sign up with role **Verifier**.

| Feature | How to use |
|---------|-----------|
| **Screenshot review queue** | See all shifts with uploaded screenshots awaiting review |
| **Approve / Flag** | Mark a screenshot as verified or flag it as suspicious |
| **Expand screenshot** | Click the thumbnail to view it full-size |

### Advocate / Analyst
Sign up with role **Advocate / Analyst**.

| Feature | How to use |
|---------|-----------|
| **Commission trends** | Advocate Dashboard → line chart of platform commission rates over time (powered by analytics-service) |
| **Income distribution** | Histogram of net incomes across all workers |
| **Top complaints** | Bar chart of most-filed grievance categories |
| **Vulnerability flags** | Table of workers with deductions > 50 % in the last 30 days |
| **Grievance moderation** | Moderation page → tag complaints, assign cluster groups, escalate or resolve |

---

## Authentication Flow

```
Sign up → email verification link → log in
         ↓
     POST /api/auth/login
         ↓
    { token: "15-min JWT" }  +  Set-Cookie: refreshToken (httpOnly, 7 days)
         ↓
  Client stores token in localStorage, sends as Bearer header
         ↓
  On 401 → Axios interceptor calls POST /api/auth/refresh (sends cookie)
         ↓
  Server validates refresh token, issues new 15-min JWT + rotates cookie
```

- Access tokens expire in **15 minutes**.
- Refresh tokens are **httpOnly cookies** (not accessible to JS) and expire in **7 days**.
- Every refresh rotates the cookie — stolen refresh tokens have a limited window.
- Google OAuth also supported: click "Continue with Google" on Login or Signup.

---

## Anomaly Detection (port 8000)

The anomaly service runs four independent detection rules on a worker's full shift history:

| Rule | Trigger |
|------|---------|
| Deductions exceed gross | deductions ≥ gross earning |
| High deduction rate | Z-score of deduction % > 2.0 (outlier vs own history) |
| Income collapse | Month-over-month net income drop > 20 % |
| Low hourly rate | Z-score of hourly rate < −2.0 |

**Test directly:**
```bash
curl -X POST http://localhost:8000/detect \
  -H "Content-Type: application/json" \
  -d '{
    "worker_id": "test1",
    "shifts": [
      {"gross": 5000, "deductions": 4800, "hours": 8, "date": "2025-03-01"},
      {"gross": 4000, "deductions": 800,  "hours": 7, "date": "2025-04-01"}
    ]
  }'
```

---

## Aggregate Analytics (port 8001)

The analytics service queries MongoDB directly and exposes four endpoints consumed by the Node server and forwarded to the Advocate Dashboard:

| Endpoint | Description |
|----------|-------------|
| `GET /advocate/commission-trends` | Monthly average commission rate per platform |
| `GET /income-distribution` | Bucketised histogram of net incomes |
| `GET /top-complaints` | Top 10 grievance categories by count |
| `GET /vulnerability-flags` | Workers with deduction rate > 50 % last 30 days |

---

## Key API Endpoints (Node server)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | public | Create account |
| GET | `/api/auth/verify-email` | public | Email verification link |
| POST | `/api/auth/login` | public | Returns JWT + sets refresh cookie |
| POST | `/api/auth/refresh` | public | Rotate tokens via cookie |
| POST | `/api/auth/logout` | auth | Clear refresh cookie |
| GET | `/api/auth/google` | public | Google OAuth redirect |
| GET | `/api/earnings` | worker | List own shifts (+ anomaly data) |
| POST | `/api/earnings` | worker | Log a shift |
| POST | `/api/earnings/bulk` | worker | Bulk CSV import |
| GET | `/api/analytics/summary` | worker | Monthly + platform charts data |
| GET | `/api/analytics/city-median` | worker | City-wide peer comparison |
| GET | `/api/verifier/queue` | verifier | All shifts awaiting review |
| POST | `/api/verifier/:id/decision` | verifier | Approve / flag a shift |
| GET | `/api/grievances` | all | List grievances |
| POST | `/api/grievances` | worker | Post a grievance |
| PATCH | `/api/grievances/:id/tag` | advocate | Tag a grievance |
| PATCH | `/api/grievances/:id/cluster` | advocate | Set cluster group |
| PATCH | `/api/grievances/:id/status` | advocate | Update status |
| GET | `/api/certificate` | worker | Render HTML income certificate |
| GET | `/api/advocate/*` | advocate | Proxy to analytics-service |

Full request/response contracts: see **[API.md](./API.md)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, recharts, react-hot-toast, axios |
| Backend | Node.js, Express, Mongoose, Passport.js (Google OAuth), Multer, csv-parse, Nodemailer |
| Auth | JWT (15 min access) + httpOnly refresh cookie (7 days), bcryptjs |
| Database | MongoDB Atlas |
| Anomaly service | Python, FastAPI, NumPy, SciPy |
| Analytics service | Python, FastAPI, pymongo |

---

## Demo Accounts (after seeding)

All seeded workers have password: `Password123!`

| Email | Role | City | Category |
|-------|------|------|----------|
| `worker_lahore_0@fakedomain.com` | worker | Lahore | ride-hailing |
| `worker_karachi_0@fakedomain.com` | worker | Karachi | food-delivery |
| `worker_islamabad_0@fakedomain.com` | worker | Islamabad | freelance |
| `worker_peshawar_0@fakedomain.com` | worker | Peshawar | domestic |

Create a **Verifier** or **Advocate** account manually via the signup page (no seed needed for those roles).

---

## Judges' Checklist

- [ ] Run `node scripts/seed.js` once to populate demo data
- [ ] Start all 4 services (see "Running All Services" above)
- [ ] Sign up as a **Worker** → log a shift with an absurdly high deduction → see anomaly banner
- [ ] Upload a screenshot → switch to a **Verifier** account → approve/flag it
- [ ] Open **Worker Dashboard** → observe monthly trends and city median
- [ ] Open **Certificate** page → preview → print
- [ ] Sign up as **Advocate** → open Advocate Dashboard → view commission/vulnerability data
- [ ] Post a grievance as a Worker, then moderate it as an Advocate
- [ ] Let the JWT expire (15 min) — the app should silently refresh and stay logged in
