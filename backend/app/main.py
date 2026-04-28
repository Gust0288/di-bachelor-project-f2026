from flask import Flask, jsonify

from app.core.database import ping_database

app = Flask(__name__)


@app.get("/health")
def health():
    try:
        database_ok = ping_database()
    except Exception:
        database_ok = False

    return jsonify({"status": "ok", "database": "ok" if database_ok else "error"})
