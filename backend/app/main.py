from flask import Flask, jsonify, render_template_string
from flask_cors import CORS

from app.api.routes.admin import admin_bp
from app.api.routes.auth import auth_bp
from app.api.routes.cvr import cvr_bp
from app.api.routes.documents import documents_bp
from app.api.routes.registration import registration_bp
from app.core.config import get_settings
from app.core.database import ping_database
from app.extensions import limiter
from app.openapi_spec import build_spec

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
_settings = get_settings()
_cors_origins = [o.strip() for o in _settings.frontend_url.split(",") if o.strip()]
CORS(app, origins=_cors_origins)
limiter.init_app(app)

app.register_blueprint(admin_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(cvr_bp)
app.register_blueprint(registration_bp)
app.register_blueprint(documents_bp)


@app.get("/health")
def health():
    try:
        database_ok = ping_database()
    except Exception:
        database_ok = False
    return jsonify({"status": "ok", "database": "ok" if database_ok else "error"})


@app.get("/openapi.json")
def openapi_spec():
    return jsonify(build_spec())


_SWAGGER_HTML = """<!DOCTYPE html>
<html>
<head>
  <title>DI Indmeldelsesportal API</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: "/openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: "BaseLayout",
    deepLinking: true,
    tryItOutEnabled: true,
  });
</script>
</body>
</html>"""


@app.get("/docs", strict_slashes=False)
def swagger_ui():
    return render_template_string(_SWAGGER_HTML)
