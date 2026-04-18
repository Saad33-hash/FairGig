# FairGig — Inter-Service API Contracts

## Service Map

| Service | Tech | Port | Start Command |
|---|---|---|---|
| Node.js Backend | Express.js | 5000 | `cd Server && node index.js` |
| Anomaly Detection | Python FastAPI | 8000 | `cd anomaly-service && uvicorn main:app --port 8000 --reload` |
| Analytics Service | Python FastAPI | 8001 | `cd analytics-service && uvicorn main:app --port 8001 --reload` |
| React Frontend | Vite | 5173 | `cd Client && npm run dev` |

---

## Inter-Service Communication

| Caller | Target | Method | Endpoint | When |
|---|---|---|---|---|
| Node.js Earnings | Anomaly Service | POST | `localhost:8000/detect` | On every GET /api/earnings/shifts |
| Node.js Advocate | Analytics Service | GET | `localhost:8001/advocate/*` | On every advocate dashboard request |
| Frontend | Node.js | REST | `localhost:5000/api/*` | All user actions |

---

## Anomaly Detection Service — `localhost:8000`

### POST /detect
Judges can call this endpoint directly with any crafted payload.

**Request body**
```json
{
  "worker_id": "string",
  "shifts": [
    {
      "date": "2025-01-15",
      "platform": "Careem",
      "gross_earned": 3000,
      "platform_deductions": 1290,
      "net_received": 1710,
      "hours_worked": 8
    },
    {
      "date": "2025-01-20",
      "platform": "Careem",
      "gross_earned": 2800,
      "platform_deductions": 560,
      "net_received": 2240,
      "hours_worked": 7
    }
  ]
}
```

**Response**
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
  "summary": "1 anomaly detected in your recent earnings."
}
```

**Anomaly types**
| Type | Trigger |
|---|---|
| `deductions_exceed_gross` | `platform_deductions > gross_earned` |
| `unusual_deduction` | Deduction rate Z-score \|z\| > 2.0 |
| `monthly_income_drop` | Month-on-month net drop > 20% |
| `low_hourly_rate` | Hourly rate Z-score z < -2.0 |

### GET /health
```json
{ "status": "ok", "service": "anomaly-detection" }
```

---

## Analytics Service — `localhost:8001`

### GET /advocate/commission-trends
```json
{
  "trends": [
    { "month": "2025-01", "platform": "Careem", "avgCommission": 24.3 }
  ]
}
```

### GET /advocate/income-distribution
```json
{
  "distribution": [
    { "city": "Lahore", "totalNet": 450000, "shiftCount": 120, "avgPerShift": 3750 }
  ]
}
```

### GET /advocate/top-complaints
```json
{
  "total": 12,
  "byCategory": [{ "category": "commission-change", "count": 7 }],
  "byPlatform":  [{ "platform": "Careem", "count": 9 }]
}
```

### GET /advocate/vulnerability-flags?threshold=0.20
```json
{
  "count": 3,
  "flags": [
    {
      "workerId": "...a1b2c3d4",
      "city": "Karachi",
      "category": "ride-hailing",
      "fromMonth": "2024-12",
      "toMonth": "2025-01",
      "dropPct": 34.5
    }
  ]
}
```

### GET /health
```json
{ "status": "ok", "service": "analytics" }
```

---

## Node.js Backend — `localhost:5000`

All protected routes require: `Authorization: Bearer <JWT>`

### Auth
| Method | Endpoint | Auth | Body / Params |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | `{ firstName, lastName, email, password, role, city?, category? }` |
| POST | `/api/auth/login` | Public | `{ email, password }` |
| GET | `/api/auth/me` | JWT | — |
| GET | `/api/auth/google` | Public | Redirects to Google OAuth |

### Earnings (Worker only)
| Method | Endpoint | Body / Params |
|---|---|---|
| POST | `/api/earnings/shifts` | `{ platform, date, hoursWorked, grossEarned, platformDeductions, city, category }` |
| GET | `/api/earnings/shifts` | Query: `page, limit, platform, from, to` |
| PUT | `/api/earnings/shifts/:id` | Same as POST |
| DELETE | `/api/earnings/shifts/:id` | — |
| POST | `/api/earnings/shifts/csv-import` | multipart/form-data: `file` (.csv) |
| POST | `/api/earnings/shifts/:id/screenshot` | multipart/form-data: `screenshot` (image) |
| GET | `/api/earnings/shifts/:id/screenshot` | — |

### Verifier only
| Method | Endpoint | Body |
|---|---|---|
| GET | `/api/verifier/queue` | Query: `page, limit` |
| POST | `/api/verifier/screenshots/:id/review` | `{ status: "verified"\|"flagged"\|"unverifiable", note? }` |

### Analytics (Worker only)
| Method | Endpoint |
|---|---|
| GET | `/api/analytics/worker/summary` |
| GET | `/api/analytics/worker/city-median` |

### Advocate only (proxied to analytics-service)
| Method | Endpoint |
|---|---|
| GET | `/api/advocate/commission-trends` |
| GET | `/api/advocate/income-distribution` |
| GET | `/api/advocate/top-complaints` |
| GET | `/api/advocate/vulnerability-flags` |

### Grievances (all authenticated)
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/api/grievances` | Worker | `{ platform, category, description }` |
| GET | `/api/grievances` | Any | Query: `page, limit, platform, category, status` |
| PUT | `/api/grievances/:id/tag` | Advocate | `{ tags: ["string"] }` |
| PUT | `/api/grievances/:id/cluster` | Advocate | `{ clusterGroup: "string" }` |
| PUT | `/api/grievances/:id/status` | Advocate | `{ status: "escalated"\|"resolved", advocateNote? }` |

### Certificate (Worker only)
| Method | Endpoint | Params |
|---|---|---|
| GET | `/api/certificate` | Query: `from=YYYY-MM-DD&to=YYYY-MM-DD` |

Returns `Content-Type: text/html` — a print-ready income certificate.