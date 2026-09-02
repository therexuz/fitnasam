"""Dependencia de autenticación: valida JWT de Supabase Auth (HS256).

En desarrollo (si DEV_USER_ID está definido) se permite usar un usuario fijo sin
token. En producción DEV_USER_ID debe ir vacío, de modo que toda petición exige
un Bearer token válido firmado con JWT_SECRET.
"""

import jwt
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings


async def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    token = auth.split(" ", 1)[1].strip() if auth.lower().startswith("bearer ") else ""

    if not token:
        if settings.DEV_USER_ID:
            return settings.DEV_USER_ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta token de autorización"
        )

    secret = settings.JWT_SECRET
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT_SECRET no configurado",
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
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
