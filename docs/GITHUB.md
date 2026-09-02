# Flujo de trabajo en GitHub

fitnasam usa Git + GitHub con un flujo simple de ramas y PRs. El despliegue en
Render es por **Auto Deploy desde `main`**.

## Ramas

- `main` — producción. Render despliega automáticamente cuando recibe cambios.
- `develop` — integración. Recibe los cambios ya probados antes de ir a `main`.
- `feature/<nombre>` — una rama por cambio/incremento.

## Flujo de trabajo

1. Crea una rama desde `develop`:
   ```powershell
   git checkout develop
   git pull
   git checkout -b feature/nombre-del-cambio
   ```
2. Haz los cambios y valida localmente (ver `AGENTS.md`):
   - Backend: `ruff check .` y `pytest`
   - Frontend: `npm run build`
3. Commitea con mensaje corto en español e imperativo:
   ```
   Agrega endpoint de OCR
   ```
4. Sube la rama y abre un **Pull Request** hacia `develop`.
5. **CI** corre automáticamente en el PR (backend + frontend). No hagas merge
   hasta que los checks estén verdes.
6. Revisa y **aprueba** el PR en GitHub (o pide cambios).
7. Al hacer merge a `develop`, abre otro PR de `develop` → `main` para producción,
   o mergea directamente cuando esté listo. El push a `main` dispara el Auto Deploy
   de Render.

## Secretos y variables

- **Nunca** commitees secretos. Usa:
  - Local: `backend/.env` (ignorado) y `frontend/.env.local` (ignorado).
  - Render: variables en el dashboard (`render.yaml` con `sync: false`).
- `.env.example` se puede versionar; no lleva valores reales.

## Qué NO se versiona

Vía `.gitignore`: `opencode.json`, `.opencode/`, `.env*`, `.venv/`,
`node_modules/`, `dist/`, `__pycache__/`, etc.

## CI/CD

- `.github/workflows/ci.yml` — corre en cada PR y push a `main`/`develop`:
  - Backend: `ruff check` + `pytest`.
  - Frontend: `npm ci` + `npm run build`.
- Render **Auto Deploy** se conecta al repo y redespliega ante cada push a `main`.
