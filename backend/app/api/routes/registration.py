import uuid as _uuid

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import registration as reg_service
from app.services.flow_definition import FLOW_DEFINITION

registration_bp = Blueprint("registration", __name__, url_prefix="/registration")


def _valid_uuid(value: str) -> bool:
    try:
        _uuid.UUID(value)
        return True
    except ValueError:
        return False


def _pydantic_errors(e: ValidationError) -> list[dict]:
    result = []
    for err in e.errors(include_url=False):
        clean = {k: (str(v) if isinstance(v, Exception) else v) for k, v in err.items()}
        if "ctx" in clean and isinstance(clean["ctx"], dict):
            clean["ctx"] = {
                k: str(v) if isinstance(v, Exception) else v
                for k, v in clean["ctx"].items()
            }
        result.append(clean)
    return result


@registration_bp.get("/flow")
def get_flow():
    return jsonify(FLOW_DEFINITION)


@registration_bp.post("/session")
def create_session():
    session = reg_service.create_session()
    return jsonify(session), 201


@registration_bp.get("/session/<session_id>")
def get_session(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        session = reg_service.get_session(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(session)


@registration_bp.post("/session/<session_id>/step/<int:step_number>")
def submit_step(session_id: str, step_number: int):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    data = request.get_json(silent=True) or {}
    try:
        result = reg_service.save_step(session_id, step_number, data)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValidationError as e:
        return (
            jsonify({"error": "validation_error", "detail": _pydantic_errors(e)}),
            422,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@registration_bp.get("/session/<session_id>/step/<int:step_number>")
def get_step_data(session_id: str, step_number: int):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        session = reg_service.get_session(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    step_data = session.get("step_data", {}).get(str(step_number), {})
    return jsonify({"step_number": step_number, "data": step_data})


@registration_bp.get("/session/<session_id>/step/6/suggestions")
def get_branch_suggestions(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        suggestions = reg_service.get_branch_suggestions(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(suggestions)


@registration_bp.post("/email-verification/send")
async def global_send_email_verification():
    data = request.get_json(silent=True) or {}
    email = (data.get("contact_email") or "").strip()
    if not email:
        return jsonify({"error": "Email er påkrævet"}), 400
    try:
        await reg_service.send_global_email_verification(email, data)
    except ValidationError as e:
        return (
            jsonify({"error": "Ugyldig step 1-data", "details": _pydantic_errors(e)}),
            422,
        )
    except Exception as e:
        return jsonify({"error": f"Kunne ikke sende email: {e}"}), 500
    return jsonify({"email": email})


@registration_bp.post("/email-verification/confirm")
def global_confirm_email_verification():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    code = str(data.get("code") or "").strip()
    if not email or not code:
        return jsonify({"error": "Email og kode er påkrævet"}), 400
    try:
        result = reg_service.confirm_global_email_verification(email, code)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@registration_bp.post("/session/<session_id>/email-verification/send")
async def send_email_verification(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        email = await reg_service.send_email_verification(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Kunne ikke sende email: {e}"}), 500
    return jsonify({"email": email})


@registration_bp.post("/session/<session_id>/email-verification/confirm")
def confirm_email_verification(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    data = request.get_json(silent=True) or {}
    code = str(data.get("code", "")).strip()
    if not code:
        return jsonify({"error": "Mangler bekræftelseskode"}), 400
    try:
        reg_service.confirm_email_verification(session_id, code)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"verified": True})


@registration_bp.post("/session/<session_id>/submit")
def submit_registration(session_id: str):
    if not _valid_uuid(session_id):
        return jsonify({"error": "Ugyldig session_id"}), 404
    try:
        result = reg_service.submit_registration(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)
