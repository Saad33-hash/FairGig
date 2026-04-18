# FairGig — Analytics Service

Python FastAPI microservice that provides aggregate KPIs for the advocate analytics panel. Reads MongoDB directly using pymongo.

## Start command

```bash
cd analytics-service
uvicorn main:app --port 8001 --reload
```

Service runs at `http://localhost:8001`

## Requirements

```bash
pip install fastapi uvicorn pymongo python-dotenv
```

## Environment variables

Create a `.env` file in this folder:
```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
DB_NAME=Softec
```

## Endpoints

### GET /advocate/commission-trends
Average platform deduction rate per month over the last 6 months.

**Response**
```json
{
  "trends": [
    { "month": "2025-01", "platform": "Careem", "avgCommission": 24.3 },
    { "month": "2025-01", "platform": "Bykea",  "avgCommission": 19.1 }
  ]
}
```

### GET /advocate/income-distribution
Total net income and shift count per city over the last 3 months.

**Response**
```json
{
  "distribution": [
    { "city": "Lahore", "totalNet": 450000, "shiftCount": 120, "avgPerShift": 3750 }
  ]
}
```

### GET /advocate/top-complaints
Grievance counts by category and platform over the last 7 days.

**Response**
```json
{
  "total": 12,
  "byCategory": [{ "category": "commission-change", "count": 7 }],
  "byPlatform":  [{ "platform": "Careem", "count": 9 }]
}
```

### GET /advocate/vulnerability-flags
Anonymised workers whose net income dropped more than 20% month-on-month.

**Query param:** `threshold` (default: 0.20) — e.g. `?threshold=0.30` for 30% drop

**Response**
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