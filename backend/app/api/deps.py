"""Dependencia de autenticación: valida JWT de Supabase Auth (HS256) o usuario dev."""

import jwt
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings


async def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth or not auth.lower().startswith("bearer "):
        if settings.DEV_USER_ID:
            return settings.DEV_USER_ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Falta token de autorización"
        )

    token = auth.split(" ", 1)[1].strip()
    secret = settings.JWT_SECRET
    if not secret:
        if settings.DEV_USER_ID:
            return settings.DEV_USER_ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT_SECRET no configurado",
        )

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
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
    if user_id == settings.DEV_USER_ID:
        return user_id
    return user_id
