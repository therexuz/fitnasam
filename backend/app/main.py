"""Aplicación FastAPI de fitnasam.

Autenticación: se valida el JWT de Supabase Auth (ES256 vía JWKS) con la
dependencia `get_current_user_id` (ver app/api/deps.py). Si no llega token y
existe DEV_USER_ID en el entorno, se usa un usuario de desarrollo para probar
localmente sin base de Auth conectada.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings

logger = logging.getLogger("fitnasam")

app = FastAPI(title="fitnasam", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    origin = request.headers.get("origin")
    headers = {}
    if origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
        headers=headers,
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
