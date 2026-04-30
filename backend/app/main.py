from flask import Flask, jsonify
from flask_cors import CORS

from app.api.routes.cvr import cvr_bp
from app.core.database import ping_database

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

app.register_blueprint(cvr_bp)


@app.get("/health")
def health():
    try:
        database_ok = ping_database()
    except Exception:
        database_ok = False

    return jsonify({"status": "ok", "database": "ok" if database_ok else "error"})
