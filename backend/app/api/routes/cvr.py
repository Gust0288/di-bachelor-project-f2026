from flask import Blueprint, jsonify, request

from app.services.cvr import lookup_company

cvr_bp = Blueprint("cvr", __name__, url_prefix="/cvr")


@cvr_bp.get("/lookup")
def lookup():
    vat = request.args.get("vat")
    name = request.args.get("name")

    if not vat and not name:
        return jsonify({"error": "Angiv enten 'vat' (CVR-nr) eller 'name'"}), 400

    try:
        if vat:
            result = lookup_company(vat, "vat")
        else:
            result = lookup_company(name, "name")  # type: ignore[arg-type]
    except ValueError as e:
        code = 404 if str(e) == "NOT_FOUND" else 502
        return jsonify({"error": str(e)}), code

    return jsonify(result)
