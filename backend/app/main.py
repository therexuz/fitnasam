"""Aplicación FastAPI de fitnasam.

Autenticación: se valida el JWT de Supabase Auth (ES256 vía JWKS) con la
dependencia `get_current_user_id` (ver app/api/deps.py). Si no llega token y
existe DEV_USER_ID en el entorno, se usa un usuario de desarrollo para probar
localmente sin base de Auth conectada.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings

app = FastAPI(title="fitnasam", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
