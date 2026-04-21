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

- **Step Wizard** – guidet #-trins registreringsflow med conditional logic
- **CVR opslag** – autofyld af virksomhedsoplysninger via CVR API
- **Session lagring** – gem og fortsæt senere via PostgreSQL (mitID mock)
- **Dokumentupload** – valgfri upload af kontrakter og overenskomster
- **Admin panel** – godkendelse, overblik og kontakt til registrerede virksomheder

## Kom i gang

### Med Docker

```bash
docker-compose up
```

### Frontend (lokalt)

```bash
cd frontend
npm install
npm run dev
```

## Miljøvariabler

Opret en `.env` fil i `/backend`:

```
DATABASE_URL=postgresql://user:password@db/di_portal
CVR_API_KEY=din_nøgle
JWT_SECRET=din_secret
```
