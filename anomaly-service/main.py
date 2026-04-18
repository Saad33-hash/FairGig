from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime
from collections import defaultdict

app = FastAPI(title="FairGig Anomaly Detection Service")


# ── Request / Response models ─────────────────────────────────────────────────

class Shift(BaseModel):
    date: str
    platform: str
    gross_earned: float
    platform_deductions: float
    net_received: float
    hours_worked: float


class DetectRequest(BaseModel):
    worker_id: str
    shifts: List[Shift]


class Anomaly(BaseModel):
    shift_date: str
    type: str
    severity: str
    explanation: str


class DetectResponse(BaseModel):
    worker_id: str
    anomalies: List[Anomaly]
    summary: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def severity_label(z: float) -> str:
    az = abs(z)
    if az >= 3.0:
        return "high"
    if az >= 2.5:
        return "medium"
    return "low"


def fmt_pct(value: float) -> str:
    return f"{round(value * 100)}%"


# ── Main detection logic ──────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse)
def detect(req: DetectRequest):
    anomalies: List[Anomaly] = []
    shifts = req.shifts

    if not shifts:
        return DetectResponse(worker_id=req.worker_id, anomalies=[], summary="No shifts provided.")

    # ── Rule 1: deductions exceed gross ──────────────────────────────────────
    for s in shifts:
        if s.platform_deductions > s.gross_earned:
            anomalies.append(Anomaly(
                shift_date=s.date,
                type="deductions_exceed_gross",
                severity="high",
                explanation=(
                    f"Platform deductions (PKR {s.platform_deductions:,.0f}) exceeded gross earned "
                    f"(PKR {s.gross_earned:,.0f}) on this shift — net received was negative."
                ),
            ))

    # ── Rule 2: Z-score on deduction rates ───────────────────────────────────
    rates = []
    for s in shifts:
        rate = (s.platform_deductions / s.gross_earned) if s.gross_earned > 0 else 0.0
        rates.append(rate)

    if len(rates) >= 3:
        arr = np.array(rates, dtype=float)
        mean_rate = float(np.mean(arr))
        std_rate  = float(np.std(arr))

        if std_rate > 0:
            for i, s in enumerate(shifts):
                z = (rates[i] - mean_rate) / std_rate
                if abs(z) >= 2.0:
                    typical_pct = fmt_pct(mean_rate)
                    this_pct    = fmt_pct(rates[i])
                    anomalies.append(Anomaly(
                        shift_date=s.date,
                        type="unusual_deduction",
                        severity=severity_label(z),
                        explanation=(
                            f"Platform deducted {this_pct} on this shift — your typical rate is "
                            f"{typical_pct}. This is {abs(z):.1f} standard deviations "
                            f"{'above' if z > 0 else 'below'} your average."
                        ),
                    ))

    # ── Rule 3: month-on-month net drop > 20% ────────────────────────────────
    monthly: dict = defaultdict(float)
    for s in shifts:
        try:
            month_key = datetime.fromisoformat(s.date).strftime("%Y-%m")
        except ValueError:
            continue
        monthly[month_key] += s.net_received

    sorted_months = sorted(monthly.keys())
    for i in range(1, len(sorted_months)):
        prev_month = sorted_months[i - 1]
        curr_month = sorted_months[i]
        prev_net   = monthly[prev_month]
        curr_net   = monthly[curr_month]

        if prev_net > 0:
            drop = (prev_net - curr_net) / prev_net
            if drop > 0.20:
                anomalies.append(Anomaly(
                    shift_date=curr_month,
                    type="monthly_income_drop",
                    severity="high" if drop > 0.40 else "medium",
                    explanation=(
                        f"Net income dropped by {fmt_pct(drop)} from {prev_month} "
                        f"(PKR {prev_net:,.0f}) to {curr_month} (PKR {curr_net:,.0f})."
                    ),
                ))

    # ── Rule 4: hourly rate outlier (Z-score) ────────────────────────────────
    hourly_rates = []
    for s in shifts:
        rate = (s.net_received / s.hours_worked) if s.hours_worked > 0 else 0.0
        hourly_rates.append(rate)

    if len(hourly_rates) >= 3:
        arr_h = np.array(hourly_rates, dtype=float)
        mean_h = float(np.mean(arr_h))
        std_h  = float(np.std(arr_h))

        if std_h > 0:
            for i, s in enumerate(shifts):
                z = (hourly_rates[i] - mean_h) / std_h
                if z < -2.0:
                    anomalies.append(Anomaly(
                        shift_date=s.date,
                        type="low_hourly_rate",
                        severity=severity_label(z),
                        explanation=(
                            f"Your effective hourly rate on this shift was PKR {hourly_rates[i]:,.0f}/hr — "
                            f"your average is PKR {mean_h:,.0f}/hr. "
                            f"This is {abs(z):.1f} standard deviations below your norm."
                        ),
                    ))

    # ── Summary ───────────────────────────────────────────────────────────────
    count = len(anomalies)
    if count == 0:
        summary = "No anomalies detected. Your earnings look consistent."
    elif count == 1:
        summary = "1 anomaly detected in your recent earnings."
    else:
        summary = f"{count} anomalies detected in your recent earnings."

    return DetectResponse(worker_id=req.worker_id, anomalies=anomalies, summary=summary)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "anomaly-detection"}
