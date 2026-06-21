from datetime import datetime
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from PIL import Image
from typing import Any, Dict, Optional
import io, json, os, tempfile

from monsters import MONSTERS
from monster_sprites import MONSTER_SPRITES

# Loads backend/.env (this repo's own secrets, e.g. MONSTER_STATUS_TOKEN) —
# independent of pm2's env_file mechanism, which doesn't reliably propagate
# into this app's `interpreter: 'none'` + raw uvicorn invocation.
load_dotenv()

QUESTBOARD_PUBLIC_ORIGIN = "https://questboard.138.197.81.63.nip.io"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[QUESTBOARD_PUBLIC_ORIGIN],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_DATA_DIR   = os.environ.get("QUESTBOARD_DATA", "/data")
STATE_FILE  = os.path.join(_DATA_DIR, "state.json")
CONFIG_FILE = os.path.join(_DATA_DIR, "config.json")

# frontend/public/ sits one level up from backend/ — sprite `src` paths in
# monster_sprites.py are root-relative (e.g. "/sprites/monsters2/rat.png"),
# matching how Vite serves frontend/public/ at the site root.
_FRONTEND_PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")


def read_json(path):
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            pass
    return None


def write_json(path, data):
    dir_path = os.path.dirname(path)
    os.makedirs(dir_path, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=dir_path)
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f)
        os.replace(tmp_path, path)
    except Exception:
        os.unlink(tmp_path)
        raise


@app.get("/state")
def get_state():
    return read_json(STATE_FILE) or {}


@app.post("/state")
async def post_state(data: Dict[str, Any]):
    write_json(STATE_FILE, data)
    return {"ok": True}


@app.get("/config")
def get_config():
    config = read_json(CONFIG_FILE)
    if config is None:
        return {"needs_setup": True}
    return config


@app.post("/config")
async def post_config(data: Dict[str, Any]):
    write_json(CONFIG_FILE, data)
    return {"ok": True}


# ── Monster status (Apple Watch / Shortcuts integration) ──
# Read-only snapshot of a player's daily monster fight, for external surfaces
# (an iOS Shortcut driving a Watch complication) that can't run the frontend's
# own JS. Ported from frontend/src/logic.js's dateSeededMonster()/getLevelFromXP()
# and frontend/src/data.js's MONSTERS roster (see monsters.py) — these must stay
# in sync with the frontend by hand, since a Python backend can't import JS.

MONSTER_STATUS_TOKEN = os.environ.get("MONSTER_STATUS_TOKEN")
QUESTBOARD_TIME_ZONE = ZoneInfo("America/New_York")


def _check_monster_status_token(token: Optional[str]):
    if not MONSTER_STATUS_TOKEN:
        raise HTTPException(status_code=503, detail="MONSTER_STATUS_TOKEN is not configured")
    if token != MONSTER_STATUS_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")


def _today_key():
    # Matches frontend's todayKey(): `${getFullYear()}-${getMonth()}-${getDate()}`
    # — note getMonth() is 0-indexed, so this is NOT zero-padded "YYYY-MM-DD".
    now = datetime.now(QUESTBOARD_TIME_ZONE)
    return f"{now.year}-{now.month - 1}-{now.day}"


def _level_from_xp(total_xp):
    xp = total_xp
    level = 1
    threshold = 10
    while xp >= threshold:
        xp -= threshold
        level += 1
        threshold = int(10 + 5 * (level - 1) * (level - 1))
    return level


def _date_seeded_monster(player_id, mode, date_key, player_level):
    max_tier = (
        5 if player_level >= 9 else
        4 if player_level >= 7 else
        3 if player_level >= 5 else
        2 if player_level >= 3 else 1
    )
    pool = [m for m in MONSTERS if m.get("tier", 1) <= max_tier]
    h = sum(ord(c) for c in f"{player_id}{date_key}")
    base = pool[h % len(pool)]
    is_kid = mode == "kids"
    max_hp = base["kidHP"] if is_kid else base["adultHP"]
    gold = base["kidGold"] if is_kid else base["gold"]
    return {**base, "maxHP": max_hp, "gold": gold}


def _find_player(players, name):
    if not name:
        return None
    needle = name.strip().lower()
    return next((p for p in players if p.get("name", "").strip().lower() == needle), None)


def _resolve_monster_status(player_name: Optional[str]):
    config = read_json(CONFIG_FILE)
    players = (config or {}).get("players") or []
    if not players:
        raise HTTPException(status_code=404, detail="Questboard hasn't been set up yet")

    target = _find_player(players, player_name) or _find_player(players, "Oliver") or players[0]

    state = read_json(STATE_FILE) or {}
    xp = (state.get("xp") or {}).get(target["id"], 0)
    level = _level_from_xp(xp)
    date_key = _today_key()
    monster = _date_seeded_monster(target["id"], target.get("mode", "adults"), date_key, level)
    dmg = ((state.get("monsterDamage") or {}).get(target["id"]) or {}).get(date_key, 0)
    current_hp = max(0, monster["maxHP"] - dmg)

    return {
        "player": target["name"],
        "monster": monster["name"],
        "currentHP": current_hp,
        "maxHP": monster["maxHP"],
        "defeated": current_hp <= 0,
        "imageUrl": f"{QUESTBOARD_PUBLIC_ORIGIN}/api/monster-image/{monster['id']}",
    }


@app.get("/monster-status")
def get_monster_status(player: Optional[str] = None, token: Optional[str] = None, format: str = "text"):
    _check_monster_status_token(token)
    status = _resolve_monster_status(player)
    if format == "json":
        return status
    state_text = "Defeated!" if status["defeated"] else f"{status['currentHP']}/{status['maxHP']} HP"
    return PlainTextResponse(f"{status['player']} vs {status['monster']} — {state_text}")


@app.get("/monster-status/players")
def list_monster_status_players(token: Optional[str] = None):
    _check_monster_status_token(token)
    config = read_json(CONFIG_FILE)
    players = (config or {}).get("players") or []
    if not players:
        raise HTTPException(status_code=404, detail="Questboard hasn't been set up yet")
    return {"players": [p["name"] for p in players]}


# No token required here — unlike player HP/status, monster artwork isn't
# personal/sensitive data. nginx exempts this path from the dashboard login
# gate too, so an iOS Shortcut (which has no session cookie) can fetch it
# directly via the imageUrl returned above.
@app.get("/monster-image/{monster_id}")
def get_monster_image(monster_id: str):
    sprite = MONSTER_SPRITES.get(monster_id)
    if not sprite:
        raise HTTPException(status_code=404, detail="Unknown monster")

    image_path = os.path.normpath(os.path.join(_FRONTEND_PUBLIC_DIR, sprite["src"].lstrip("/")))
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Sprite image not found")

    img = Image.open(image_path)
    fs = sprite.get("fs")
    if fs:
        # Animated horizontal strip — crop to frame 0 (top-left fs×fs square)
        # for a clean single portrait instead of the whole multi-frame sheet.
        img = img.crop((0, 0, fs, fs))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
