# Frontend – DI Indmeldelses Portal

React + TypeScript applikation til den selvbetjente indmeldelsesportal.

## Tech Stack

| Teknologi       | Formål                         |
| --------------- | ------------------------------ |
| React           | UI framework                   |
| TypeScript      | Type safety                    |
| React Hook Form | Formhåndtering                 |
| Zod             | Skema validering               |
| React Router    | Routing                        |
| React Aria      | Tilgængelighed (accessibility) |

## Projektstruktur (TBD)

```
frontend/
├── public/
├── src/
│   ├── components/       # Genbrugelige UI komponenter
│   ├── pages/            # Sidevisninger
│   ├── steps/            # Step Wizard trin (Step 1–7)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API kald til backend
│   ├── store/            # State management
│   ├── types/            # TypeScript interfaces og typer
│   └── utils/            # Hjælpefunktioner
├── .env
├── package.json
└── tsconfig.json
```

## Kom i gang

**Step 1: Start database og backend via Docker**
```bash
docker-compose up
```

Backend kører på `http://localhost:8000`. Vite proxy'er `/api/*` requests dertil automatisk.

**Step 2: Start frontend**
```bash
cd frontend
npm install
npm run dev
```

Applikationen kører på `http://localhost:5173` som standard.

## Scripts

```bash
npm run dev       # Start udviklingsserver
npm run build     # Byg til produktion
npm run preview   # Forhåndsvis produktionsbuild
npm run lint      # Kør ESLint
```

## Miljøvariabler

Kopier `.env.example` til `.env.local`. Standard-værdien (tom `VITE_API_URL`) bruger Vite proxy og kræver ingen ændringer til lokal udvikling.
