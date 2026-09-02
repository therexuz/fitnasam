"""Dependencia de autenticación: valida el JWT de Supabase Auth.

Supabase firma los tokens con ES256 (clave pública vía JWKS). Se usa el JWKS
endpoint para validar la firma; no se requiere compartir secretos.

En desarrollo (si DEV_USER_ID está definido) se permite usar un usuario fijo sin
token. En producción DEV_USER_ID debe ir vacío, de modo que toda petición exige
un Bearer token válido emitido por Supabase Auth.
"""

from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings


def _jwks_url() -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/auth/v1/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(_jwks_url())


async def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ", 1)[1].strip() if auth.lower().startswith("bearer ") else ""

    if not token:
        if settings.DEV_USER_ID:
            return settings.DEV_USER_ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta token de autorización"
        )

    if not settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SUPABASE_URL no configurado",
        )

    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido"
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin subject"
        )
    return str(sub)


async def get_current_user_id_required(
    user_id: str = Depends(get_current_user_id),
) -> str:
    return user_id
