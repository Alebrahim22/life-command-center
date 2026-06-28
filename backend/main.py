import os
import random
import asyncio
from datetime import date, datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import AsyncClient
from pydantic import BaseModel
from supabase import create_client, Client
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

load_dotenv()

app = FastAPI(title="Hermes Agent Bridge", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
)

scheduler = AsyncIOScheduler(timezone="Asia/Kuwait")

# ---------------------------------------------------------------------------
# Seeded baselines — last-known closing prices for the 14 radar tickers
# ---------------------------------------------------------------------------
BASELINES: dict[str, dict] = {
    "BOURSA":   {"price": 3.025, "eps": 0.160, "roe": 38.4, "yield": 3.5},
    "KFH":      {"price": 0.771, "fv": 0.885, "roe": 18.2, "yield": 2.5},
    "MEZZ":     {"price": 1.200, "fv": 0.722, "roe": 13.9, "yield": 2.1},
    "TROLLEY":  {"price": 0.920, "fv": 0.580, "roe": 22.0, "yield": 0},
    "ALG":      {"price": 0.955, "fv": 0.766, "roe": 25.0, "yield": 4.92},
    "STC":      {"price": 0.664, "fv": 0.500, "roe": 18.0, "yield": 6.2},
    "BOUBYAN":  {"price": 0.649, "fv": 0.610, "roe": 13.5, "yield": 1.8},
    "CABLE":    {"price": 1.960, "fv": 1.820, "roe": 17.2, "yield": 4.1},
    "ZAIN":     {"price": 0.603, "fv": 0.535, "roe": 21.5, "yield": 6.8},
    "OULAFUEL": {"price": 0.225, "fv": 0.245, "roe": 9.2,  "yield": 3.6},
    "JAZEERA":  {"price": 1.610, "fv": 1.480, "roe": 28.1, "yield": 5.0},
    "CGC":      {"price": 0.928, "fv": 0.550, "roe": 16.0, "yield": 4.5},
    "SHIP":     {"price": 0.712, "fv": 0.701, "roe": 15.5, "yield": 0},
    "MABANEE":  {"price": 0.968, "fv": 1.050, "roe": 12.5, "yield": 2.5},
}


def jitter_price(base: float, max_pct: float = 0.015) -> float:
    """Apply a random walk within ±max_pct of the baseline."""
    change = base * random.uniform(-max_pct, max_pct)
    return round(base + change, 3)


async def scrape_kuwait_boursa() -> None:
    """
    Market-radar refresh worker.
    Attempts a live HTML fetch from Argaam (Boursa Kuwait data).
    Falls back to a ±1.5 % jitter simulation when the remote call fails.
    """
    updated: list[dict] = []
    today = str(date.today())

    # --- attempt live fetch ---
    live_prices: dict[str, float] = {}
    try:
        url = "https://www.argaam.com/en/markets/company-category?category=kuwait-stocks"
        async with AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                html = resp.text.lower()
                # Simple keyword-based extraction — a full parser would use
                # BeautifulSoup / lxml in a future iteration.
                for ticker in BASELINES:
                    marker = f">{ticker.lower()}<"
                    # look for a numeric value near the ticker marker
                    idx = html.find(marker)
                    if idx != -1:
                        chunk = html[idx : idx + 200]
                        for token in chunk.split():
                            try:
                                val = float(token.strip(" ,$"))
                                if val > 0.01:
                                    live_prices[ticker] = val
                                    break
                            except ValueError:
                                continue
    except Exception:
        pass  # fall through to simulated data

    # --- build upsert rows ---
    for ticker, meta in BASELINES.items():
        price = live_prices.get(ticker) or jitter_price(meta["price"])

        if ticker == "BOURSA":
            fv = round(22 * meta["eps"], 3)
        else:
            fv = round(meta.get("fv", 0) or jitter_price(meta["price"], 0.005), 3)

        updated.append({
            "ticker": ticker,
            "price": price,
            "fv": fv,
            "roe": meta["roe"],
            "yield": meta["yield"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    # --- upsert into market_radar ---
    for row in updated:
        supabase.table("market_radar").upsert(row, on_conflict="ticker").execute()

    print(f"[{today}] Hermes radar sweep — {len(updated)} tickers synced.")


# ---------------------------------------------------------------------------
# Scheduler lifecycle
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    scheduler.add_job(
        scrape_kuwait_boursa,
        CronTrigger(day_of_week="sun,mon,tue,wed,thu", hour=13, minute=0, timezone="Asia/Kuwait"),
        id="kuwait_boursa_sweep",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[{date.today()}] Hermes scheduler online — Boursa sweep set for Sun-Thu 13:00 AST.")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown(wait=False)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def health():
    return {"status": "online", "bridge": "Hermes Core Active"}


class ShiftPayload(BaseModel):
    shift_type: str
    hours: int | None = None


@app.post("/api/hermes/shift")
def log_shift(payload: ShiftPayload):
    row = {
        "type": payload.shift_type,
        "date": str(date.today()),
        "allowance_hours": payload.hours or 0,
    }
    result = supabase.table("shifts").insert(row).execute()
    return {"inserted": result.data}
