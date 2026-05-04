import os
import uuid

from flask import Blueprint, jsonify, request

from app.core.database import get_db_cursor

documents_bp = Blueprint("documents", __name__, url_prefix="/documents")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
}


@documents_bp.post("/upload")
def upload_document():
    """Upload et dokument tilknyttet en wizard-session (f.eks. overenskomst)."""
    session_id = request.form.get("session_id")
    file = request.files.get("file")

    if not session_id or not file:
        return jsonify({"error": "session_id og fil er påkrævet"}), 400

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        return jsonify({"error": f"Filtype ikke tilladt: {file.content_type}"}), 400

    doc_id = str(uuid.uuid4())
    safe_name = f"{doc_id}_{file.filename}"
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    path = os.path.join(session_dir, safe_name)
    file.save(path)
    size = os.path.getsize(path)

    with get_db_cursor() as (_, cur):
        cur.execute(
            """
            INSERT INTO uploaded_documents
                (id, session_id, file_name, content_type, storage_path, file_size_bytes)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (doc_id, session_id, file.filename, file.content_type, path, size),
        )

    return jsonify({
        "document_id": doc_id,
        "file_name": file.filename,
        "file_size_bytes": size,
    }), 201
