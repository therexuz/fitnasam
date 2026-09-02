"""Modelos SQLAlchemy de fitnasam."""

from datetime import date, datetime, timezone

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    foods: Mapped[list["Food"]] = relationship(back_populates="user")
    food_entries: Mapped[list["FoodEntry"]] = relationship(back_populates="user")
    daily_goals: Mapped[list["DailyGoal"]] = relationship(back_populates="user")


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    kcal_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    protein_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_per_100g: Mapped[float] = mapped_column(Float, nullable=False)
    sodium_mg_per_100g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fibre_g_per_100g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sugar_g_per_100g: Mapped[float | None] = mapped_column(Float, nullable=True)
    standard_portion_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )

    user: Mapped["User"] = relationship(back_populates="foods")


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    food_id: Mapped[int] = mapped_column(ForeignKey("foods.id"), nullable=False)
    grams: Mapped[float] = mapped_column(Float, nullable=False)
    consumed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    user: Mapped["User"] = relationship(back_populates="food_entries")
    food: Mapped["Food"] = relationship()


class DailyGoal(Base):
    __tablename__ = "daily_goals"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_daily_goals_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    kcal_target: Mapped[float] = mapped_column(Float, nullable=False)
    protein_target_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_target_g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_target_g: Mapped[float] = mapped_column(Float, nullable=False)

    user: Mapped["User"] = relationship(back_populates="daily_goals")
