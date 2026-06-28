"""
Hermes Agent — Telegram Bot Interface
Long-polling bot that reads/writes the Life Command Center Supabase.
"""

import json
import os
from datetime import date, timedelta

import httpx
from dotenv import load_dotenv
import telebot
from supabase import create_client, Client

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

bot = telebot.TeleBot(BOT_TOKEN)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PRAYER_API = "https://api.aladhan.com/v1/timings?latitude=29.3759&longitude=47.9774&method=0"


def add_months(source: date, months: int) -> date:
    total = source.month + months - 1
    y = source.year + total // 12
    m = total % 12 + 1
    try:
        return date(y, m, source.day)
    except ValueError:
        return date(y, m + 1, 1) - timedelta(days=1)


# ---------------------------------------------------------------------------
# /start  /help
# ---------------------------------------------------------------------------
@bot.message_handler(commands=["start", "help"])
def send_help(message: telebot.types.Message):
    text = (
        "╔══════════════════════════╗\n"
        "║   Hermes Agent — Online  ║\n"
        "╚══════════════════════════╝\n\n"
        "── Commands ──\n\n"
        "/shift <type> [hours]\n"
        "  Log a shift. Types: work, sick, excused, allowance\n"
        "  Example: /shift work\n"
        "  Example: /shift allowance 2\n\n"
        "/todo <task description>\n"
        "  Add a task to your dashboard\n\n"
        "/brief\n"
        "  Morning digest — open todos, today's events, prayer times\n\n"
        "/help\n"
        "  Show this message"
    )
    bot.reply_to(message, text)


# ---------------------------------------------------------------------------
# /shift <type> [hours]
# ---------------------------------------------------------------------------
@bot.message_handler(commands=["shift"])
def log_shift(message: telebot.types.Message):
    parts = message.text.split()
    if len(parts) < 2:
        bot.reply_to(message, "Usage: /shift <type> [hours]\nTypes: work, sick, excused, allowance")
        return

    shift_type = parts[1].lower()
    if shift_type not in ("work", "sick", "excused", "allowance"):
        bot.reply_to(message, "Invalid type. Allowed: work, sick, excused, allowance")
        return

    hours = 0
    if shift_type == "allowance":
        if len(parts) >= 3 and parts[2].isdigit():
            hours = int(parts[2])
        else:
            bot.reply_to(message, "Please provide hours for allowance. Example: /shift allowance 2")
            return

    try:
        supabase.table("shifts").insert({
            "type": shift_type,
            "date": str(date.today()),
            "allowance_hours": hours,
        }).execute()

        bot.reply_to(
            message,
            f"✅ Shift logged\n"
            f"   Type: {shift_type}\n"
            f"   Date: {date.today()}\n"
            f"   Hours: {hours}",
        )
    except Exception as e:
        bot.reply_to(message, f"❌ Failed to log shift: {e}")


# ---------------------------------------------------------------------------
# /todo <task_text>
# ---------------------------------------------------------------------------
@bot.message_handler(commands=["todo"])
def add_todo(message: telebot.types.Message):
    task = message.text.removeprefix("/todo").strip()
    if not task:
        bot.reply_to(message, "Usage: /todo <task description>")
        return

    try:
        supabase.table("todos").insert({
            "text": task,
            "completed": False,
        }).execute()

        bot.reply_to(message, f"✅ Todo added:\n   {task}")
    except Exception as e:
        bot.reply_to(message, f"❌ Failed to add todo: {e}")


# ---------------------------------------------------------------------------
# /brief
# ---------------------------------------------------------------------------
@bot.message_handler(commands=["brief"])
def send_brief(message: telebot.types.Message):
    lines = []
    lines.append("📋 **Daily Brief**")
    lines.append("")

    # --- Open todos ---
    try:
        todos = supabase.table("todos").select("text").eq("completed", False).order("created_at").execute()
        items = todos.data or []
        if items:
            lines.append("**Pending Tasks:**")
            for i, t in enumerate(items[:8], 1):
                lines.append(f"  {i}. {t['text']}")
        else:
            lines.append("**Pending Tasks:** None 🎉")
    except Exception:
        lines.append("**Pending Tasks:** (unavailable)")

    lines.append("")

    # --- Today's events ---
    try:
        events = (
            supabase.table("events")
            .select("title, time")
            .eq("date", str(date.today()))
            .order("time")
            .execute()
        )
        ev = events.data or []
        if ev:
            lines.append("**Today's Events:**")
            for e in ev:
                t = f" @ {e['time']}" if e.get("time") else ""
                lines.append(f"  • {e['title']}{t}")
        else:
            lines.append("**Today's Events:** None")
    except Exception:
        lines.append("**Today's Events:** (unavailable)")

    lines.append("")

    # --- Prayer times ---
    try:
        r = httpx.get(PRAYER_API, timeout=10)
        data = r.json()
        timings = data.get("data", {}).get("timings", {})
        if timings:
            lines.append("**Prayer Times (Shafi'i):**")
            for name in ("Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"):
                if name in timings:
                    icon = {"Fajr": "🌅", "Sunrise": "☀️", "Dhuhr": "🌞", "Asr": "🌇", "Maghrib": "🌆", "Isha": "🌙"}
                    lines.append(f"  {icon.get(name, '•')} {name}: {timings[name]}")
    except Exception:
        lines.append("**Prayer Times:** (unavailable)")

    bot.reply_to(message, "\n".join(lines), parse_mode="Markdown")


# ---------------------------------------------------------------------------
# JSON-payload message handler (catch-all)
# Accepts pre-parsed JSON payloads from the Hermes Agent workflow.
# ---------------------------------------------------------------------------
@bot.message_handler(func=lambda m: m.text and not m.text.startswith("/"))
def json_payload_handler(message: telebot.types.Message):
    try:
        parsed = json.loads(message.text)
    except (json.JSONDecodeError, ValueError):
        bot.reply_to(
            message,
            "Send a structured JSON payload with an 'action' field, or use /shift, /todo, or /brief commands.\n"
            "Example: {\"action\": \"todo\", \"text\": \"Buy groceries\"}",
        )
        return

    action = parsed.get("action")

    if action == "shift":
        shift_type = parsed.get("type", "work")
        hours = parsed.get("hours", 0)
        try:
            supabase.table("shifts").insert({
                "type": shift_type,
                "date": str(date.today()),
                "allowance_hours": hours,
            }).execute()
            bot.reply_to(message, f"✅ Shift logged: {shift_type} ({hours}h)")
        except Exception as e:
            bot.reply_to(message, f"❌ Failed to log shift: {e}")

    elif action == "todo":
        task_text = parsed.get("text", "")
        if not task_text:
            bot.reply_to(message, "❌ No task text provided.")
            return
        try:
            supabase.table("todos").insert({
                "text": task_text,
                "completed": False,
            }).execute()
            bot.reply_to(message, f"✅ Todo added: {task_text}")
        except Exception as e:
            bot.reply_to(message, f"❌ Failed to add todo: {e}")

    elif action == "trade":
        try:
            supabase.table("trading_journal").insert({
                "ticker": parsed.get("ticker", ""),
                "side": parsed.get("side", "buy"),
                "quantity": parsed.get("quantity", 0),
                "price": parsed.get("price", 0.0),
                "notes": parsed.get("notes", ""),
                "date": str(date.today()),
            }).execute()
            bot.reply_to(
                message,
                f"✅ Trade recorded: {parsed.get('side')} {parsed.get('quantity')}x {parsed.get('ticker')} @ {parsed.get('price')}",
            )
        except Exception as e:
            bot.reply_to(message, f"❌ Failed to record trade: {e}")

    elif action == "brief":
        send_brief(message)

    elif action == "warranty":
        item = parsed.get("item_name", "")
        provider = parsed.get("provider", "")
        months = parsed.get("duration_months", 12)
        if not item or not provider:
            bot.reply_to(message, "❌ Please specify both the item name and provider.")
            return
        purchase = date.today()
        expiration = add_months(purchase, months)
        try:
            supabase.table("warranties").insert({
                "item_name": item,
                "provider": provider,
                "purchase_date": str(purchase),
                "expiration_date": str(expiration),
            }).execute()
            bot.reply_to(
                message,
                f"✅ Warranty logged\n"
                f"   Item: {item}\n"
                f"   Provider: {provider}\n"
                f"   Expires: {expiration} ({months}mo)",
            )
        except Exception as e:
            bot.reply_to(message, f"❌ Failed to log warranty: {e}")

    elif action == "chat":
        reply = parsed.get("reply_text", "I'm not sure what to say.")
        bot.reply_to(message, reply)

    else:
        bot.reply_to(message, f"❌ Unknown action '{action}'. Try: shift, todo, trade, brief, warranty, chat.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("🤖 Hermes Agent — Telegram bot polling...")
    print("   JSON payload handler active — send JSON with 'action' field")
    bot.infinity_polling()
