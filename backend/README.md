# Backend – DI Indmeldelses Portal

Python + Flask applikation der håndterer forretningslogik, datavalidering og ekstern API integration.

## Tech Stack

| Teknologi  | Formål                    |
| ---------- | ------------------------- |
| Python     | Programmeringssprog       |
| Flask      | API framework             |
| PostgreSQL | Primær database           |
| psycopg2   | Database driver (raw SQL) |
| Pydantic   | Datavalidering            |
| JWT        | Autentificering           |
| httpx      | HTTP klient (CVR opslag)  |

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
│   │   └── database.py           # DB forbindelse (psycopg2)
│   ├── schemas/                  # Pydantic schemas (validering)
│   ├── services/                 # Business logik
│   └── main.py
├── requirements.txt
└── .env
```

## Kom i gang

```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
docker compose up --build
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

```env
DATABASE_URL=postgresql://user:password@localhost:5433/di_portal
CVR_API_KEY=din_nøgle
JWT_SECRET=din_secret
```

## Database

Skemaet ligger i `schema.sql` og kan indlæses direkte fra backend-koden:

```bash
cd backend
python -m app.core.database
```

Session-fremskridt gemmes i `registration_sessions`, og færdige indmeldelser ligger i `registrations`.

## Code format python

black .
