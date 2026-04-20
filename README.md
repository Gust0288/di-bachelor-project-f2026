# DI Indmeldelses Portal (In Progress)

En selvbetjent digital indmeldelsesportal, der gør det muligt for virksomheder at registrere sig hos Dansk Industri uden manuel sagsbehandling.

## Projektstruktur

```
/
├── frontend/   # React + TypeScript
├── backend/    # Python + Flask
└── README.md
```

## Tech Stack

| Lag      | Teknologi                 |
| -------- | ------------------------- |
| Frontend | React, TypeScript         |
| Backend  | Python, Flask, PostgreSQL |
| Auth     | JWT                       |

## Funktioner

- **Step Wizard** – guidet 7-trins registreringsflow med conditional logic
- **CVR opslag** – autofyld af virksomhedsoplysninger via CVR API
- **Session lagring** – gem og fortsæt senere via PostgreSQL
- **Dokumentupload** – valgfri upload af kontrakter og overenskomster
- **Admin panel** – godkendelse, overblik og kontakt til registrerede virksomheder

## Kom i gang

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask --app app.main:app run --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Miljøvariabler

Opret en `.env` fil i `/backend`:

```
SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost/di_portal
CVR_API_KEY=din_nøgle
JWT_SECRET=din_secret
```
