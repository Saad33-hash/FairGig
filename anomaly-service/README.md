# FairGig — Anomaly Detection Service

Python FastAPI microservice that analyses a gig worker's earnings history and flags statistically unusual deductions or sudden income drops.

## Start command

```bash
cd anomaly-service
uvicorn main:app --port 8000 --reload
```

Service runs at `http://localhost:8000`

## Requirements

```bash
pip install fastapi uvicorn numpy scipy
```

## Endpoints

### POST /detect
Judges can call this directly with a crafted payload.

**Request**
```json
{
  "worker_id": "abc123",
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

**Response**
```json
{
  "worker_id": "abc123",
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

**Detection rules**
| Rule | Logic |
|---|---|
| `deductions_exceed_gross` | Platform deductions > gross earned |
| `unusual_deduction` | Deduction rate Z-score \|z\| > 2.0 across worker's shifts |
| `monthly_income_drop` | Month-on-month net drop > 20% |
| `low_hourly_rate` | Hourly rate Z-score z < -2.0 across worker's shifts |

**Severity levels:** `high` (|z| ≥ 3.0), `medium` (|z| ≥ 2.5), `low` (|z| ≥ 2.0)

### GET /health
```json
{ "status": "ok", "service": "anomaly-detection" }
```