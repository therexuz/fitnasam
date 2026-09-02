"""Motor y sesión asíncronos de SQLAlchemy (asyncpg por defecto)."""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def _resolve_url() -> str:
    url = settings.SUPABASE_DB_URL
    if not url:
        return ""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def get_engine():
    global _engine
    if _engine is None:
        url = _resolve_url()
        if not url:
            return None
        _engine = create_async_engine(url, pool_pre_ping=True)
    return _engine


def get_session_factory():
    global _session_factory
    engine = get_engine()
    if engine is None:
        return None
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
    return _session_factory


async def get_db():
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("SUPABASE_DB_URL no configurado")
    async with factory() as session:
        yield session
