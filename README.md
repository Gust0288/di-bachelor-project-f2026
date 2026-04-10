# DI Indmeldelses Portal (In Progress)

En selvbetjent digital indmeldelsesportal, der gør det muligt for virksomheder at registrere sig hos Dansk Industri uden manuel sagsbehandling.

## Projektstruktur

```
/
├── frontend/   # React + TypeScript
├── backend/    # Python + FastAPI
└── README.md
```

## Tech Stack (TBD)

| Lag      | Teknologi                               |
| -------- | --------------------------------------- |
| Frontend | React, TypeScript, React Hook Form, Zod |
| Backend  | Python, FastAPI, PostgreSQL             |
| Caching  | Redis                                   |
| Auth     | JWT                                     |

## Funktioner

- **Step Wizard** – guidet 7-trins registreringsflow med conditional logic
- **CVR opslag** – autofyld af virksomhedsoplysninger via CVR API
- **Session caching** – gem og fortsæt senere (1–2 uger afhængig af fremdrift)
- **Dokumentupload** – valgfri upload af kontrakter og overenskomster
- **Admin panel** – godkendelse, overblik og kontakt til registrerede virksomheder

## Kom i gang

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

API dokumentation tilgængelig på `http://localhost:8000/docs` når backend kører.

## Miljøvariabler

Opret en `.env` fil i `/backend`:

```
DATABASE_URL=postgresql://user:password@localhost/di_portal
REDIS_URL=redis://localhost:6379
CVR_API_KEY=din_nøgle
JWT_SECRET=din_secret
```
