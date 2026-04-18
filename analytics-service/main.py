from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
from collections import defaultdict
import os

load_dotenv()

app = FastAPI(title="FairGig Analytics Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME   = os.getenv("DB_NAME", "Softec")

client = MongoClient(MONGO_URI)
db     = client[DB_NAME]
shifts_col     = db["shifts"]
grievances_col = db["grievances"]


def month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "analytics"}


# ── Commission trends ─────────────────────────────────────────────────────────
# GET /advocate/commission-trends
# Returns avg deduction rate per platform per month (last 6 months)

@app.get("/advocate/commission-trends")
def commission_trends():
    cutoff = datetime.utcnow() - timedelta(days=180)
    docs   = list(shifts_col.find(
        {"date": {"$gte": cutoff}, "grossEarned": {"$gt": 0}},
        {"platform": 1, "date": 1, "grossEarned": 1, "platformDeductions": 1}
    ))

    # { platform → { month → [rates] } }
    data: dict = defaultdict(lambda: defaultdict(list))
    for d in docs:
        rate = d["platformDeductions"] / d["grossEarned"]
        mk   = month_key(d["date"])
        data[d["platform"]][mk].append(rate)

    # Flatten to list of { month, platform, avgCommission }
    result = []
    for platform, months in data.items():
        for month, rates in months.items():
            result.append({
                "month":         month,
                "platform":      platform,
                "avgCommission": round(sum(rates) / len(rates) * 100, 1),
            })

    result.sort(key=lambda x: (x["month"], x["platform"]))
    return {"trends": result}


# ── Income distribution ───────────────────────────────────────────────────────
# GET /advocate/income-distribution
# Returns monthly net income bucketed by city (last 3 months)

@app.get("/advocate/income-distribution")
def income_distribution():
    cutoff = datetime.utcnow() - timedelta(days=90)
    docs   = list(shifts_col.find(
        {"date": {"$gte": cutoff}},
        {"city": 1, "netReceived": 1}
    ))

    # { city → total net }
    city_totals: dict = defaultdict(float)
    city_counts: dict = defaultdict(int)
    for d in docs:
        city_totals[d["city"]] += d["netReceived"]
        city_counts[d["city"]] += 1

    distribution = [
        {
            "city":       city,
            "totalNet":   round(city_totals[city]),
            "shiftCount": city_counts[city],
            "avgPerShift": round(city_totals[city] / city_counts[city]) if city_counts[city] else 0,
        }
        for city in city_totals
    ]
    distribution.sort(key=lambda x: x["totalNet"], reverse=True)
    return {"distribution": distribution}


# ── Top complaints ────────────────────────────────────────────────────────────
# GET /advocate/top-complaints
# Returns grievance category counts for the last 7 days

@app.get("/advocate/top-complaints")
def top_complaints():
    cutoff = datetime.utcnow() - timedelta(days=7)
    docs   = list(grievances_col.find(
        {"createdAt": {"$gte": cutoff}},
        {"category": 1, "platform": 1}
    ))

    category_counts: dict = defaultdict(int)
    platform_counts: dict = defaultdict(int)
    for d in docs:
        if d.get("category"):
            category_counts[d["category"]] += 1
        if d.get("platform"):
            platform_counts[d["platform"]] += 1

    by_category = [{"category": k, "count": v} for k, v in category_counts.items()]
    by_platform = [{"platform": k, "count": v} for k, v in platform_counts.items()]
    by_category.sort(key=lambda x: x["count"], reverse=True)
    by_platform.sort(key=lambda x: x["count"], reverse=True)

    return {
        "total":       len(docs),
        "byCategory":  by_category,
        "byPlatform":  by_platform,
    }


# ── Vulnerability flags ───────────────────────────────────────────────────────
# GET /advocate/vulnerability-flags
# Returns anonymised workers whose net income dropped >20% month-on-month

@app.get("/advocate/vulnerability-flags")
def vulnerability_flags(threshold: float = Query(0.20, ge=0.0, le=1.0)):
    cutoff = datetime.utcnow() - timedelta(days=90)
    docs   = list(shifts_col.find(
        {"date": {"$gte": cutoff}},
        {"workerId": 1, "date": 1, "netReceived": 1, "city": 1, "category": 1}
    ))

    # { workerId → { month → net } }
    worker_months: dict = defaultdict(lambda: defaultdict(float))
    worker_meta:   dict = {}
    for d in docs:
        wid = str(d["workerId"])
        mk  = month_key(d["date"])
        worker_months[wid][mk] += d["netReceived"]
        worker_meta[wid] = {"city": d.get("city", ""), "category": d.get("category", "")}

    flags = []
    for wid, months in worker_months.items():
        sorted_months = sorted(months.keys())
        for i in range(1, len(sorted_months)):
            prev = months[sorted_months[i - 1]]
            curr = months[sorted_months[i]]
            if prev > 0:
                drop = (prev - curr) / prev
                if drop > threshold:
                    flags.append({
                        "workerId":  wid[-8:],   # last 8 chars only — anonymised
                        "city":      worker_meta[wid]["city"],
                        "category":  worker_meta[wid]["category"],
                        "fromMonth": sorted_months[i - 1],
                        "toMonth":   sorted_months[i],
                        "dropPct":   round(drop * 100, 1),
                    })
                    break   # one flag per worker is enough

    flags.sort(key=lambda x: x["dropPct"], reverse=True)
    return {"count": len(flags), "flags": flags}
