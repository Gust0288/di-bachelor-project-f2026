from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.extensions import limiter
from app.services.auth import admin_login, send_login_otp, verify_login_otp

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/otp/send")
@limiter.limit("3 per minute")
async def otp_send():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email er påkrævet"}), 400

    try:
        result = await send_login_otp(email)
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@auth_bp.post("/otp/verify")
@limiter.limit("5 per minute")
def otp_verify():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    if not email or not code:
        return jsonify({"error": "Email og kode er påkrævet"}), 400

    try:
        result = verify_login_otp(email, code)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@auth_bp.post("/admin/login")
@limiter.limit("5 per minute")
def admin_login_route():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email og adgangskode er påkrævet"}), 400

    try:
        result = admin_login(email, password)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
