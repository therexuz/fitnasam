# Setup local de fitnasam

Guía para correr backend y frontend en tu máquina (Windows).

---

## Requisitos

- Python 3.14
- Node.js (18 o superior)
- Git

---

## 1. Backend (FastAPI)

Desde la carpeta `backend/`:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 1.1 Variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```powershell
Copy-Item .env.example .env
```

Variables (ver `.env.example`):

- `SUPABASE_DB_URL` — string del connection pooler de Supabase (puerto **6543**, `sslmode=require`)
- `SUPABASE_URL` — `https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY` — clave anon
- `SUPABASE_SERVICE_ROLE_KEY` — clave service_role
- `JWT_SECRET` — secreto HS256
- `OCR_TESSERACT_LANG` — `spa`
- `DEV_USER_ID` — id de usuario de desarrollo (permite probar sin Auth)

> Si no tienes Supabase todavía, puedes dejar `SUPABASE_DB_URL` vacío y usar `DEV_USER_ID`
> para probar endpoints que no requieran base de datos. Para datos reales, corre las
> migraciones en Supabase (ver `docs/DEPLOY.md`): `001_init.sql` (esquema),
> `002_rls.sql` (RLS + revoke de PostgREST) y `003_handle_new_user.sql` (crea
> `public.users` al registrarse). No olvides `CORS_ORIGINS` con tu origen local.

### 1.2 Levantar el servidor

```powershell
uvicorn app.main:app --reload
```

La API queda en `http://localhost:8000`. Prueba `http://localhost:8000/health`.

---

## 2. Frontend (React + Vite)

Desde la carpeta `frontend/`:

```powershell
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173` (Vite muestra la URL exacta).

Para apuntar al backend local y a Supabase, crea un archivo `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Luego reinicia `npm run dev`.

> El frontend usa **login con email + contraseña** vía `supabase-js`. Necesitas que
> el proveedor "Email" esté habilitado en Supabase (Authentication → Providers).
> Al iniciar sesión, el token que obtiene `supabase-js` se envía a FastAPI como
> `Authorization: Bearer`.
>
> Para que el **registro** funcione localmente sin quedar atascado en la
> confirmación por email:
> - **Authentication → URL Configuration → Site URL** → `http://localhost:5173`
> - **Redirect URLs** → añade `http://localhost:5173/**`
> - Desactivar **"Confirm email"** (`Authentication → Settings → Email → Confirm email`)
>   para entrar directo tras registrarse.

---

## 3. Probar el OCR localmente

El OCR usa **Tesseract** con el idioma español (`spa`).

### En Windows

1. Descarga e instala Tesseract desde [github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki).
2. Durante la instalación, marca el paquete de idioma **Spanish**.
3. Asegúrate de que `pytesseract` encuentre el ejecutable. Si no está en el PATH, indícalo en tu código o en el `.env`:

   ```powershell
   # Ejemplo si tesseract.exe está en "C:\Program Files\Tesseract-OCR\tesseract.exe"
   ```

   `pytesseract` busca `tesseract` en el PATH; verifica con:

   ```powershell
   tesseract --version
   tesseract --list-langs
   ```

   Debe aparecer `spa` en la lista de idiomas.

### Verificación rápida

Con el backend corriendo, envía una imagen de una etiqueta chilena al endpoint de OCR.
El resultado debe ser un **borrador editable** (nunca inventa valores ausentes).

---

## 4. Validación

```powershell
# Backend
cd backend
python -m pytest
python -m ruff check .

# Frontend
cd frontend
npm run build
npm run lint
```
