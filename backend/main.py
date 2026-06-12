from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict
import json, os, tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://questboard.138.197.81.63.nip.io"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_DATA_DIR   = os.environ.get("QUESTBOARD_DATA", "/data")
STATE_FILE  = os.path.join(_DATA_DIR, "state.json")
CONFIG_FILE = os.path.join(_DATA_DIR, "config.json")


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
