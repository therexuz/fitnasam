# Despliegue de fitnasam en Render + Supabase

Guía paso a paso para poner fitnasam en producción. La arquitectura es:

- **Supabase** — Postgres administrado. Solo almacena datos.
- **Render** — corre el backend (FastAPI) como *web service* y el frontend (Vite) como *static site*.
- Todo el cómputo (kcal/macros, regla de 3, OCR) corre en FastAPI.

---

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Elige una región cercana (por ejemplo `us-east-1` o la más próxima a tus usuarios).
3. Cuando el proyecto esté listo, abre el **SQL Editor** en el dashboard.

---

## 2. Correr las migraciones

1. Abre `backend/migrations/001_init.sql` en tu editor y copia todo el contenido.
2. Pégalo en el **SQL Editor** de Supabase y ejecútalo.
3. Verifica que se hayan creado las tablas `users`, `foods`, `food_entries` y `daily_goals`.
4. Luego abre `backend/migrations/002_rls.sql` y ejecútalo también.
5. Por último ejecuta `backend/migrations/003_handle_new_user.sql` para que al
   registrarse un usuario en Supabase Auth se cree automáticamente su fila en
   `public.users` (con el UUID de `auth.users`).

> El cómputo vive en FastAPI; estas migraciones solo definen el esquema de
> almacenamiento y la seguridad (RLS). `002_rls.sql` habilita **Row Level Security**
> y revoca el acceso por PostgREST, dejando la data solo accesible por el backend
> (que usa `service_role` y **bypasea** RLS, por lo que no se ve afectado).

---

## 3. Obtener las credenciales de Supabase

En el dashboard, ve a **Project Settings → API** y anota:

- `SUPABASE_URL` → `https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY` → la clave "anon public"
- `SUPABASE_SERVICE_ROLE_KEY` → la clave "service_role" (¡nunca la expongas en el frontend!)

En **Project Settings → Database → Connection string**:

- Selecciona la pestaña **Session pooler** y copia el string.
- Debe usar el **puerto 6543** y `sslmode=require`, por ejemplo:

  ```
  postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
  ```

  Ese string es tu `SUPABASE_DB_URL`.

> Importante: usa siempre el **connection pooler (6543)**, no el puerto directo 5432.

También genera un secreto para `JWT_SECRET` (este debe ser el mismo que usa
Supabase para firmar los tokens: Project Settings → API → JWT Settings → "JWT secret").

## 3.1 Habilitar el login (Email)

1. En Supabase, ve a **Authentication → Providers → Email**.
2. Actívalo (viene habilitado por defecto con "Email" + contraseña).
3. Configura las URLs para que el email de confirmación apunte a tu dominio real
   (por defecto Supabase usa `http://localhost:3000`, que rompe el registro):
   - **Authentication → URL Configuration → Site URL** → `https://fitnasam-web.onrender.com`
   - **Authentication → URL Configuration → Redirect URLs** → añade `https://fitnasam-web.onrender.com/**`
     (y, para desarrollo local, `http://localhost:5173/**`)
4. Para que el registro sea inmediato (registrarse y entrar sin email de
   confirmación), desactiva **"Confirm email"**:
   **Authentication → Settings → Email → Confirm email → desactivado**.
5. Como `JWT_SECRET` en Render usa el mismo secreto de **JWT Settings** para que
   FastAPI valide los tokens HS256 emitidos por Supabase Auth.

---

## 4. Configurar variables en Render

El archivo `render.yaml` (en la raíz del proyecto) ya define los dos servicios y las
variables con `sync: false`. Al crear el Blueprint desde el repo, Render te pedirá
que ingreses los valores; quedan guardados en el dashboard y **nunca se commitean**.

Variables del backend (`fitnasam-api`):

- `SUPABASE_DB_URL` — string del pooler (puerto 6543, `sslmode=require`)
- `SUPABASE_URL` — `https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY` — clave anon
- `SUPABASE_SERVICE_ROLE_KEY` — clave service_role
- `JWT_SECRET` — secreto HS256 (el **mismo** que Supabase usa para firmar los JWT; ver Project Settings → API → JWT Settings)
- `OCR_TESSERACT_LANG` — `spa` (ya viene con valor por defecto)
- `DEV_USER_ID` — **vacío** en producción (exige login real)
- `CORS_ORIGINS` — `https://fitnasam-web.onrender.com` (origen del frontend)

Variables del frontend (`fitnasam-web`):

- `VITE_API_URL` — la URL pública del backend, por ejemplo `https://fitnasam-api.onrender.com/api`
- `VITE_SUPABASE_URL` — `https://<ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` — la clave anon (se puede exponer; se usa solo para login en el cliente)

---

## 5. Desplegar el backend

El backend usa un `Dockerfile` (`backend/Dockerfile`) que:

1. Parte de `python:3.14-slim`.
2. Instala `tesseract-ocr` y `tesseract-ocr-spa` (idioma español).
3. Instala las dependencias de `requirements.txt` (incluye `pytesseract`).
4. Corre `uvicorn app.main:app` en el puerto `$PORT` que Render asigna.

Con el `render.yaml` en la raíz, Render detecta el Blueprint y crea ambos servicios
automáticamente. Si prefieres crearlos a mano:

- **New → Web Service** → conecta el repo.
- Root directory: `backend`.
- Runtime: Docker.
- Build/start: el Dockerfile se encarga de todo.

Tras el despliegue, verifica con `GET https://<tu-backend>/health` que responda `{"status": "ok"}`.

---

## 6. Desplegar el frontend

El frontend es un **static site**:

- Root directory: `frontend`.
- Build command: `npm install && npm run build`.
- Publish directory: `dist`.
- Variable de entorno: `VITE_API_URL` con la URL de tu backend.

El build de Vite inyecta `VITE_API_URL` en el bundle; debe apuntar al backend desplegado.

---

## 7. Verificación final

1. Abre la URL del frontend (ej. `https://fitnasam-web.onrender.com`).
2. Crea un alimento y verifica que se guarde en Supabase (tabla `foods`).
3. Sube una foto de una etiqueta chilena y confirma que el OCR (español) devuelve un borrador editable.

---

## Notas

- El **free tier** de Render duerme los servicios tras inactividad; el primer request puede tardar ~50 s.
- Nunca commitees `JWT_SECRET`, claves de Supabase ni strings de conexión. Usa `sync: false` / `.env.example`.
- Si necesitas editar variables, ve a **Environment** en el dashboard de Render (no al código).
