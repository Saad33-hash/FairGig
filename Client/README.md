# FairGig — React Frontend

React 19 + Vite + Tailwind CSS v4 frontend for the FairGig platform.

## Start command

```bash
cd Client
npm run dev
```

Frontend runs at `http://localhost:5173`

## Requirements

```bash
npm install
```

## Environment variables

Create a `.env` file in this folder:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Pages by role

### Worker
| Route | Page |
|---|---|
| `/app/worker/dashboard` | Analytics dashboard — earnings charts, city median |
| `/app/worker/earnings` | Shift logger — add/edit/delete shifts, CSV import, screenshot upload |
| `/app/worker/certificate` | Income certificate generator — date range picker, print |
| `/app/grievances` | Grievance board — view and post complaints |

### Verifier
| Route | Page |
|---|---|
| `/app/verifier/queue` | Screenshot review queue — confirm/flag/mark unverifiable |
| `/app/grievances` | Grievance board — read only |

### Advocate
| Route | Page |
|---|---|
| `/app/advocate/dashboard` | Analytics panel — commission trends, income distribution, vulnerability flags |
| `/app/advocate/moderation` | Grievance moderation — tag, cluster, escalate complaints |
| `/app/grievances` | Grievance board — read only |