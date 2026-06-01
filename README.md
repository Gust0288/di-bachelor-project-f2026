# DI Indmeldelses Portal

En selvbetjent digital indmeldelsesportal, der gør det muligt for virksomheder at registrere sig hos Dansk Industri uden manuel sagsbehandling.

## Tech Stack

| Lag        | Teknologi                                                              |
|------------|------------------------------------------------------------------------|
| Frontend   | React 18, TypeScript (strict), Vite 4, React Aria Components, React Router v6, SCSS / CSS Modules |
| Backend    | Python 3, Flask 3.1, PostgreSQL 16, Pydantic, Gunicorn, httpx          |
| Auth       | OTP-login (brugere) + email+password (admin) → JWT (python-jose)       |
| Email      | SMTP via Gmail App Password                                            |

---

## Projektstruktur

```
/
├── docker-compose.yml          # Backend (port 8000) + PostgreSQL (port 5433)
├── Makefile                    # Dev-kommandoer
├── render.yaml                 # Deployment-konfiguration (Render.com)
├── backend/
│   ├── app/
│   │   ├── api/routes/         # auth.py, registration.py, cvr.py, admin.py, documents.py
│   │   ├── core/               # config.py, database.py, security.py
│   │   ├── services/           # Forretningslogik (registration, admin, email, cvr, membership)
│   │   ├── schemas/            # Pydantic-schemas
│   │   └── main.py             # Flask app entry point
│   ├── migrations/             # SQL-migrationsfiler
│   ├── schema.sql              # Komplet databaseskema
│   ├── requirements.txt
│   └── .env                    # Miljøvariabler (se nedenfor)
└── frontend/
    └── src/
        ├── App.tsx             # Routing + global ToastRegion
        ├── api/                # API-klienter (registration, admin, auth, cvr)
        ├── components/         # 24 genbrugelige UI-komponenter
        ├── layouts/            # LoginLayout, WizardLayout
        ├── pages/
        │   ├── Login/          # OTP-login + admin-login
        │   ├── Wizard/         # 10-trins registreringswizard + steps/
        │   └── Admin/          # Admin-panel med 4 sektioner
        └── styles/             # tokens.scss, theme.scss, global.scss
```

---

## Funktioner

- **10-trins registreringswizard** – conditional logic, autosave, blokerende dialogs
- **CVR-opslag** – automatisk autofyld af virksomhedsoplysninger via eksternt CVR API
- **Session-persistens** – gem og fortsæt registrering via PostgreSQL (14 dages levetid)
- **E-mailbekræftelse** – OTP-kode sendes til brugerens e-mail for identitetsbekræftelse
- **Dokumentupload** – upload af kontrakter og overenskomster (PDF, billeder)
- **Membership tier-beregning** – automatisk beregnet ud fra medarbejderantal
- **Branche-autoforslag** – forslag til tilknyttede foreninger baseret på branchekode
- **Admin-panel** – 4 sektioner: Overblik, Afventende, Sessioner, Aktivitetslog
- **Godkendelses-/afvisningsworkflow** – med fritekstnoter og e-mailnotifikation
- **JWT-baseret admin-auth** – adskilt login til admin-panelet
- **Rate limiting** – på OTP- og CVR-endpoints
- **OpenAPI/Swagger** – automatisk API-dokumentation på `/docs`

---

## Wizard-flow (10 trin)

| Trin | Navn                    | Indhold                                           |
|------|-------------------------|---------------------------------------------------|
| 1    | Virksomhedsoplysninger  | CVR-opslag, kontaktperson, adresse                |
| 2    | Branche                 | Branchevalg med autoforslag                       |
| 3    | Behov                   | Servicevalg (overenskomst, juridisk rådgivning, m.m.) |
| 4    | Medarbejdere            | Antal-tier-valg                                   |
| 5    | Aftale                  | Fagforeningsstatus                                |
| 6    | Brancheforeninger       | Tilknyttede brancheforeninger                     |
| 7    | Medlemskab              | Valg af medlemskabstype                           |
| 8    | Kontaktpersoner         | Yderligere kontaktpersoner med telefon og e-mail  |
| 9    | Godkendelse             | Vilkår og betingelser + dokumentupload            |
| 10   | MitID-verifikation      | UI-simulering *(ikke rigtig MitID-integration endnu)* |

---

## Kom i gang

### Forudsætninger

- [Docker](https://www.docker.com/) + Docker Compose
- [Node.js](https://nodejs.org/) 18+
- Python 3.11+

### 1. Klon repo

```bash
git clone <repo-url>
cd di-bachelor-project-f2026
```

### 2. Konfigurer miljøvariabler

Opret `backend/.env` (eksempel-fil medfølger i repoet):

```env
DATABASE_URL=postgresql://user:password@localhost:5433/di_portal
JWT_SECRET=skift-mig-i-produktion

# Gmail SMTP – brug et App Password (ikke dit normale kodeord)
# Opret via: myaccount.google.com → Sikkerhed → 2-trinsbekræftelse → App-adgangskoder
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=din@gmail.com

# Valgfri – CVR-opslag (fungerer uden, men returnerer dummy-data)
CVR_API_KEY=
```

Frontend kræver ingen `.env` til lokal udvikling – Vite-proxyen videresender automatisk API-kald til `localhost:8000`.

### 3. Start fuld stack med Docker

```bash
docker compose up --build
```

Docker-containeren kører automatisk databaseskema, migrationer og seeder en default-admin ved opstart.

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:5173 *(kør separat – se trin 4)* |
| Backend API    | http://localhost:8000        |
| API-dokumentation | http://localhost:8000/docs |

### 4. Frontend lokalt (hot-reload)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 5. Backend lokalt (uden Docker)

Kræver en kørende PostgreSQL. Start kun databasen med Docker:

```bash
docker compose up db
```

Start derefter backend:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate    # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
flask --app app.main:app run --reload
```

---

## Makefile

```bash
make install        # Installer alle afhængigheder (frontend + backend venv)
make up             # Start Docker-stack
make up-build       # Start Docker-stack og byg images
make dev            # Start frontend dev-server
make down           # Stop Docker-stack
make logs           # Følg Docker-logs
make db-reset       # Nulstil database (slet volumes + gendan skema)
make test-all       # Kør alle tests (frontend + backend)
make test-frontend  # Kør frontend-tests
make test-backend   # Kør backend-integrationstests
make test-coverage  # Frontend-tests med coverage-rapport
make lint           # Kør linters (ESLint + flake8)
make typecheck      # TypeScript type-check
make build          # Byg frontend til produktion
```

---

## Tests

```bash
make test-all           # Alle tests
make test-frontend      # Frontend (27 testfiler)
make test-backend       # Backend (55+ test-cases)*
make test-coverage      # Frontend med coverage-rapport
```

*\* Backend-integrationstests kræver en kørende PostgreSQL. Start kun databasen med `docker compose up db`.*


## Roadmap

- [ ] Rigtig MitID-integration (trin 10 er i dag en UI-simulering)
- [ ] Betalingsflow / fakturering (backend-kode eksisterer, men er ikke forbundet til UI)
