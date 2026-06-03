## [1.0.0] - 2026-06-03

Første stabile udgivelse af DI Indmeldelses-portalen — en selvbetjeningsportal
til virksomhedsindmeldelse hos Dansk Industri uden manuel sagsbehandling.

### Added

- **Indmeldelses-wizard** med 10 steps (single-page, state-styret):
  virksomhedsinfo, branchevalg, behov, medarbejdere, overenskomst,
  brancheforeninger, medlemskab, kontaktpersoner, godkendelse og
  MitID-verifikation (simuleret).
- **Sessionsstyring**: kladder gemmes pr. step i PostgreSQL og kan genoptages
  via session-link; sessioner udløber efter 14 dage.
- **E-mailverifikation** før oprettelse af session samt OTP-baseret login.
- **CVR-autofyld** i step 1 via CVR API (CVRAPI / Virkdata) med fallback.
- **Admin-panel**: oversigt, behandling af indmeldelser (godkend/afvis med
  e-mail), aktive kladder, aktivitetslog, noter og dokument-download.
  Beskyttet med JWT og bcrypt-hashede admin-logins.
- **Filupload** af overenskomstdokumenter med MIME-validering.
- **REST API** med Pydantic-validering, rate limiting og auto-genereret
  OpenAPI-spec samt Swagger UI på `/docs`.
- **`/health`-endpoint** med database-ping og versionsangivelse.
- **CI-pipeline** (GitHub Actions): lint, type-check, tests, build,
  container-scanning og deploy ved `v*`-tags.

[1.0.0]: https://github.com/Gust0288/di-bachelor-project-f2026/releases/tag/v1.0.0
