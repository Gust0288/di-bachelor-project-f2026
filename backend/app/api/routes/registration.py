from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import registration as reg_service
from app.services.flow_definition import FLOW_DEFINITION

registration_bp = Blueprint("registration", __name__, url_prefix="/registration")


def _pydantic_errors(e: ValidationError) -> list[dict]:
    result = []
    for err in e.errors(include_url=False):
        clean = {k: (str(v) if isinstance(v, Exception) else v) for k, v in err.items()}
        if "ctx" in clean and isinstance(clean["ctx"], dict):
            clean["ctx"] = {k: str(v) if isinstance(v, Exception) else v
                            for k, v in clean["ctx"].items()}
        result.append(clean)
    return result


@registration_bp.get("/flow")
def get_flow():
    """
    Hent den komplette wizard flow-definition.
    ---
    tags:
      - flow
    produces:
      - application/json
    responses:
      200:
        description: Komplet flow-definition med alle 11 steps, felter og blokerende options.
    """
    return jsonify(FLOW_DEFINITION)


@registration_bp.post("/session")
def create_session():
    """
    Opret en ny wizard-session.
    ---
    tags:
      - session
    produces:
      - application/json
    responses:
      201:
        description: Session oprettet.
        schema:
          properties:
            session_id:
              type: string
              example: "550e8400-e29b-41d4-a716-446655440000"
            current_step:
              type: integer
              example: 1
            expires_at:
              type: string
              example: "2026-05-18T10:00:00+00:00"
    """
    session = reg_service.create_session()
    return jsonify(session), 201


@registration_bp.get("/session/<session_id>")
def get_session(session_id: str):
    """
    Hent session state (bruges til at genoptage en session).
    ---
    tags:
      - session
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
        description: UUID på session
    produces:
      - application/json
    responses:
      200:
        description: Session state med step_data, flags og tier.
      404:
        description: Session ikke fundet eller udløbet.
    """
    try:
        session = reg_service.get_session(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(session)


@registration_bp.post("/session/<session_id>/step/<int:step_number>")
def submit_step(session_id: str, step_number: int):
    """
    Gem data for et wizard-step.
    ---
    tags:
      - steps
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
      - name: step_number
        in: path
        type: integer
        required: true
        description: "Step nummer (1-10). Step 1: virksomhedsinformation, Step 4: medarbejdere, Step 5: overenskomst, Step 6: branchefællesskaber"
      - name: body
        in: body
        required: true
        schema:
          type: object
          description: |
            Step-specifikt JSON objekt. Eksempler per step:

            **Step 1** – Virksomhedsinformation:
            ```json
            { "cvr_number": "12345678", "company_name": "Test A/S", "contact_name": "Jane Doe", "contact_email": "jane@test.dk" }
            ```

            **Step 2** – Kontaktadresse:
            ```json
            { "address_choice": "cvr" }
            ```

            **Step 3** – Servicevalg:
            ```json
            { "selected_services": ["overenskomst", "personalejuridisk_raadgivning"] }
            ```

            **Step 4** – Antal medarbejdere:
            ```json
            { "employee_count": 25 }
            ```

            **Step 5** – Overenskomst (nej/ved_ikke/ja):
            ```json
            { "overenskomst_status": "nej" }
            { "overenskomst_status": "ja", "overenskomst_type": "direkte" }
            { "overenskomst_status": "ved_ikke" }
            ```

            **Step 6** – Branchefællesskaber:
            ```json
            { "branchefaellesskaber": ["di-byggeri", "di-digital"] }
            ```

            **Step 7** – Bekræft membership (computed_membership fra session.step_data["7"]):
            ```json
            { "membership_type": "Branchemedlem", "accept_membership": true }
            ```

            **Step 8** – Kontaktpersoner:
            ```json
            { "managing_director": { "name": "Jane Doe", "email": "jane@test.dk" } }
            ```

            **Step 9** – Accepter betingelser:
            ```json
            { "accept_terms": true, "accept_authority": true }
            ```

            **Step 10** – MitID (mock – godkendes automatisk af backend):
            ```json
            {}
            ```
    produces:
      - application/json
    responses:
      200:
        description: Step gemt. is_blocked=true hvis et blokerende svar er valgt – current_step rykker ikke frem.
        schema:
          properties:
            session_id:
              type: string
            current_step:
              type: integer
            tier:
              type: string
              example: "smv"
            flags:
              type: object
              example: {"non_ovk": true}
            is_blocked:
              type: boolean
            blocking_popup:
              type: object
              description: Vises kun hvis is_blocked=true. Indeholder title, message, phone, email.
            next_step:
              type: integer
      404:
        description: Session ikke fundet.
      422:
        description: Valideringsfejl i input data.
    """
    data = request.get_json(silent=True) or {}
    try:
        result = reg_service.save_step(session_id, step_number, data)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValidationError as e:
        return jsonify({"error": "validation_error", "detail": _pydantic_errors(e)}), 422
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)


@registration_bp.get("/session/<session_id>/step/<int:step_number>")
def get_step_data(session_id: str, step_number: int):
    """
    Hent gemt data for et specifikt step (bruges ved back-navigation).
    ---
    tags:
      - steps
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
      - name: step_number
        in: path
        type: integer
        required: true
    produces:
      - application/json
    responses:
      200:
        description: Gemt step-data.
      404:
        description: Session ikke fundet.
    """
    try:
        session = reg_service.get_session(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    step_data = session.get("step_data", {}).get(str(step_number), {})
    return jsonify({"step_number": step_number, "data": step_data})


@registration_bp.get("/session/<session_id>/step/6/suggestions")
def get_branch_suggestions(session_id: str):
    """
    Hent foreslåede DI branchefællesskaber baseret på CVR-branchekode fra step 1.
    ---
    tags:
      - steps
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
    produces:
      - application/json
    responses:
      200:
        description: mandatory (låste forslag), suggested (anbefalede), all (alle 13 fællesskaber).
      404:
        description: Session ikke fundet.
    """
    try:
        suggestions = reg_service.get_branch_suggestions(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(suggestions)


@registration_bp.post("/session/<session_id>/submit")
def submit_registration(session_id: str):
    """
    Afslut wizard og opret den endelige registrering (kræver at alle 11 steps er gennemført).
    ---
    tags:
      - session
    parameters:
      - name: session_id
        in: path
        type: string
        required: true
    produces:
      - application/json
    responses:
      200:
        description: Registrering oprettet og session markeret som submitted.
        schema:
          properties:
            registration_id:
              type: string
            session_id:
              type: string
            status:
              type: string
              example: submitted
      400:
        description: Wizard ikke gennemført endnu.
      404:
        description: Session ikke fundet.
    """
    try:
        result = reg_service.submit_registration(session_id)
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(result)
