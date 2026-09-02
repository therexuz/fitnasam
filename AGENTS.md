# AGENTS.md

Guía para los agentes que construyen **fitnasam**, app de registro calórico y de
macros (bajar grasa + ganar músculo).

## Estructura

```
backend/    FastAPI (Python) — modelos, cálculo, regla de 3, OCR, auth
frontend/   React + Vite + TypeScript (PWA)
docs/       Documentación y decisiones
.opencode/  Config de opencode (skills)
```

## Stack

- Backend: Python 3.14, FastAPI (async), Pydantic v2, SQLAlchemy 2.x, pytesseract.
- Base de datos: Supabase (Postgres). Solo almacena datos; el cómputo vive en FastAPI.
- Frontend: React + Vite + TypeScript, PWA (manifest + service worker).
- OCR: Tesseract (`spa`) + parser estructurado del etiquetado chileno.
- Deploy: Render (web service backend + static frontend).

## Reglas obligatorias (todo agente)

1. Lee las skills relevantes antes de escribir código:
   - `nutrition-calculator` para cálculo de kcal/macros/regla de 3.
   - `chile-label-ocr` para OCR/parsing de etiquetas.
   - `supabase-setup` para integración de base de datos.
   - `render-deploy` para despliegue.
2. No hardcodear secretos. Usa variables de entorno (`.env`, nunca commiteado).
3. Alimentos se guardan siempre en **base 100g**.
4. El OCR devuelve un **borrador editable**; nunca inventa valores ausentes.
5. Valida tu trabajo antes de terminar (comandos abajo).

## Comandos de validación

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest        # tests (si existen)
python -m ruff check .  # lint
```

### Frontend

```powershell
cd frontend
npm install
npm run build           # typecheck + build
npm run lint            # lint
```

## Convenciones

- Idioma de la UI: español.
- Commits: mensaje corto en español, estilo imperativo ("Agrega endpoint de OCR").
- No agregar comentarios al código salvo que se pidan explícitamente.
