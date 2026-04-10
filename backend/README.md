# Backend – DI Indmeldelses Portal

Python + FastAPI applikation der håndterer forretningslogik, datavalidering og ekstern API integration.

## Tech Stack

| Teknologi  | Formål                         |
| ---------- | ------------------------------ |
| Python     | Programmeringssprog            |
| FastAPI    | API framework                  |
| PostgreSQL | Primær database                |
| SQLAlchemy | ORM                            |
| Pydantic   | Datavalidering                 |
| Redis      | Session caching                |
| JWT        | Autentificering                |
| httpx      | Async HTTP klient (CVR opslag) |

## Projektstruktur (TBD)

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── registration.py   # Step wizard endpoints
│   │   │   ├── cvr.py            # CVR opslag
│   │   │   ├── admin.py          # Admin dashboard
│   │   │   └── documents.py      # Fil upload
│   │   └── dependencies.py       # Auth, DB session osv.
│   ├── core/
│   │   ├── config.py             # Miljøvariabler
│   │   ├── security.py           # JWT, hashing
│   │   └── cache.py              # Redis logik
│   ├── models/                   # SQLAlchemy DB modeller
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # Business logik
│   └── main.py
├── requirements.txt
└── .env
```

## Kom i gang

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API dokumentation tilgængelig på `http://localhost:8000/docs` når serveren kører.

## Scripts

```bash
uvicorn app.main:app --reload       # Start udviklingsserver
uvicorn app.main:app --host 0.0.0.0 # Start produktionsserver
```

## Endpoints

```
POST   /api/registration/start              # Opret ny session
GET    /api/registration/{session_id}       # Hent gemt progress
PUT    /api/registration/{session_id}/step/{n}  # Gem step data
POST   /api/registration/{session_id}/submit    # Indsend registrering

GET    /api/cvr/{cvr_number}                # CVR opslag + autofyld

POST   /api/documents/upload                # Upload filer

GET    /api/admin/registrations             # Alle indmeldelser
PUT    /api/admin/registrations/{id}/approve    # Godkend
POST   /api/admin/contact/{id}              # Kontakt virksomhed
```

## Miljøvariabler

Opret en `.env` fil i `/backend`:

```
DATABASE_URL=postgresql://user:password@localhost/di_portal
REDIS_URL=redis://localhost:6379
CVR_API_KEY=din_nøgle
JWT_SECRET=din_secret
```
