from __future__ import annotations

import uuid

from flask import Blueprint, g, jsonify, request, send_file

from app.core.security import require_admin
from app.services import admin as admin_service

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


@admin_bp.get("/registrations")
@require_admin
def list_registrations():
    status = request.args.get("status") or None
    if status and status not in ("pending", "approved", "rejected"):
        return jsonify({"error": "Ugyldig status-filter"}), 400
    rows = admin_service.list_registrations(status_filter=status)
    return jsonify(rows)


@admin_bp.get("/registrations/<registration_id>")
@require_admin
def get_registration(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    try:
        row = admin_service.get_registration(registration_id)
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    return jsonify(row)


@admin_bp.get("/registrations/<registration_id>/documents")
@require_admin
def get_documents(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    docs = admin_service.get_registration_documents(registration_id)
    return jsonify(docs)


@admin_bp.post("/registrations/<registration_id>/approve")
@require_admin
def approve_registration(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    try:
        result = admin_service.approve_registration(registration_id, g.admin_id)
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)


@admin_bp.post("/registrations/<registration_id>/reject")
@require_admin
def reject_registration(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    data = request.get_json(silent=True) or {}
    notes = (data.get("notes") or "").strip()
    if not notes:
        return jsonify({"error": "Afvisningsbegrundelse er påkrævet"}), 400
    try:
        result = admin_service.reject_registration(registration_id, g.admin_id, notes)
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)


@admin_bp.get("/stats")
@require_admin
def get_stats():
    return jsonify(admin_service.get_stats())


@admin_bp.get("/registrations/<registration_id>/notes")
@require_admin
def get_notes(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    notes = admin_service.get_notes(registration_id)
    return jsonify(notes)


@admin_bp.post("/registrations/<registration_id>/notes")
@require_admin
def add_note(registration_id: str):
    if not _valid_uuid(registration_id):
        return jsonify({"error": "Ugyldig registration_id"}), 404
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Note-indhold er påkrævet"}), 400
    try:
        result = admin_service.add_note(registration_id, g.admin_id, content)
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result), 201


@admin_bp.get("/sessions")
@require_admin
def list_sessions():
    rows = admin_service.list_sessions()
    return jsonify(rows)


@admin_bp.get("/sessions/<session_id>")
@require_admin
def get_session(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        row = admin_service.get_session_detail(session_id)
    except LookupError as exc:
        return jsonify({"error": str(exc)}), 404
    return jsonify(row)


@admin_bp.get("/activity")
@require_admin
def get_activity():
    entries = admin_service.get_activity()
    return jsonify(entries)


@admin_bp.get("/documents/<doc_id>")
@require_admin
def get_document(doc_id: str):
    import os
    if not _valid_uuid(doc_id):
        return jsonify({"error": "Ugyldigt dokument-id"}), 400
    from app.core.database import get_db_cursor
    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            "SELECT storage_path, content_type, file_name FROM uploaded_documents WHERE id = %s",
            (doc_id,),
        )
        row = cur.fetchone()
    if not row:
        return jsonify({"error": "Dokument ikke fundet"}), 404
    abs_path = os.path.abspath(row["storage_path"])
    if not os.path.isfile(abs_path):
        return jsonify({"error": "Filen findes ikke på serveren"}), 404
    return send_file(
        abs_path,
        mimetype=row["content_type"],
        as_attachment=False,
        download_name=row["file_name"],
    )
