# FairGig — Node.js Backend

Express.js server hosting all Node.js services in one process with logically separated routers: Auth, Earnings, Verifier, Analytics, Advocate, Grievance, and Certificate.

## Start command

```bash
cd Server
node index.js
```

Server runs at `http://localhost:5000`

## Requirements

```bash
npm install
```

## Environment variables

Create a `.env` file in this folder:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<random-long-string>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-gmail>
EMAIL_PASS=<app-password>
EMAIL_FROM=FairGig<your-email>
SERVER_URL=http://localhost:5000
ANOMALY_SERVICE_URL=http://localhost:8000
ANALYTICS_SERVICE_URL=http://localhost:8001
```

## Seed script

Run once before demo to populate 250+ fake shifts for city-median comparison:
```bash
node scripts/seed.js
```

## API routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register with role/city/category |
| POST | `/api/auth/login` | Public | JWT login |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/auth/google` | Public | Google OAuth |
| POST | `/api/earnings/shifts` | Worker | Log a shift |
| GET | `/api/earnings/shifts` | Worker | List own shifts (paginated) |
| PUT | `/api/earnings/shifts/:id` | Worker | Edit shift |
| DELETE | `/api/earnings/shifts/:id` | Worker | Delete shift |
| POST | `/api/earnings/shifts/csv-import` | Worker | Bulk CSV import |
| POST | `/api/earnings/shifts/:id/screenshot` | Worker | Upload screenshot |
| GET | `/api/earnings/shifts/:id/screenshot` | Worker | Get screenshot status |
| GET | `/api/verifier/queue` | Verifier | Pending screenshots |
| POST | `/api/verifier/screenshots/:id/review` | Verifier | Submit decision |
| GET | `/api/analytics/worker/summary` | Worker | Own earnings stats |
| GET | `/api/analytics/worker/city-median` | Worker | City-wide median comparison |
| GET | `/api/advocate/commission-trends` | Advocate | Proxies analytics service |
| GET | `/api/advocate/income-distribution` | Advocate | Proxies analytics service |
| GET | `/api/advocate/top-complaints` | Advocate | Proxies analytics service |
| GET | `/api/advocate/vulnerability-flags` | Advocate | Proxies analytics service |
| POST | `/api/grievances` | Worker | Post complaint |
| GET | `/api/grievances` | Any | List grievances |
| PUT | `/api/grievances/:id/tag` | Advocate | Add tags |
| PUT | `/api/grievances/:id/cluster` | Advocate | Set cluster group |
| PUT | `/api/grievances/:id/status` | Advocate | Update status |
| GET | `/api/certificate` | Worker | Generate income certificate HTML |
| GET | `/api/health` | Public | Health check |