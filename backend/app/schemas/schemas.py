"""Schemas Pydantic v2 para la API."""

from datetime import date as date_type
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FoodCreate(BaseModel):
    name: str
    kcal_per_100g: float = Field(ge=0)
    protein_per_100g: float = Field(ge=0)
    carbs_per_100g: float = Field(ge=0)
    fat_per_100g: float = Field(ge=0)
    sodium_mg_per_100g: float | None = Field(default=None, ge=0)
    fibre_g_per_100g: float | None = Field(default=None, ge=0)
    sugar_g_per_100g: float | None = Field(default=None, ge=0)
    standard_portion_g: float | None = Field(default=None, gt=0)
    measure_type: str = Field(default="g", pattern="^(g|unidad|ml)$")
    measure_weight_g: float | None = Field(default=None, gt=0)


class FoodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    name: str
    kcal_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    sodium_mg_per_100g: float | None
    fibre_g_per_100g: float | None
    sugar_g_per_100g: float | None
    standard_portion_g: float | None
    measure_type: str
    measure_weight_g: float | None
    created_at: datetime


class FoodEntryCreate(BaseModel):
    food_id: int
    grams: float = Field(gt=0)
    date: date_type | None = None
    meal_type: str | None = Field(default=None, pattern="^(desayuno|almuerzo|cena|snack)$")


class FoodEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    food_id: int
    grams: float
    meal_type: str | None
    consumed_at: datetime
    date: date_type
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    food_name: str


class DailyGoalCreate(BaseModel):
    date: date_type
    kcal_target: float = Field(ge=0)
    protein_target_g: float = Field(ge=0)
    carbs_target_g: float = Field(ge=0)
    fat_target_g: float = Field(ge=0)
    deficit_percent: float = Field(default=0, ge=0, le=30)


class DailyGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    date: date_type
    kcal_target: float
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float
    deficit_percent: float


class MacroTargetsRequest(BaseModel):
    sexo: str = Field(description="'hombre' | 'mujer'")
    peso_kg: float = Field(gt=0)
    altura_cm: float = Field(gt=0)
    edad: int = Field(gt=0)
    factor_actividad: float = Field(gt=0)
    deficit_percent: float = Field(default=15, ge=0, le=30)
    protein_per_kg: float = Field(default=2.0, ge=1.6, le=2.2)


class NutritionCalcResult(BaseModel):
    bmi: float
    tmb: float
    tdee: float
    kcal_target: float
    protein_g: float
    carbs_g: float
    fat_g: float
    deficit_percent: float
    protein_per_kg: float


class PortionRequest(BaseModel):
    food_id: int
    grams: float = Field(gt=0)


class PortionResult(BaseModel):
    food_id: int
    grams: float
    kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float


class OCRResult(BaseModel):
    portion_g: float | None = None
    kcal_per_100g: float | None = None
    protein_per_100g: float | None = None
    carbs_per_100g: float | None = None
    fat_per_100g: float | None = None
    sodium_mg_per_100g: float | None = None
    fibre_g_per_100g: float | None = None
    sugar_g_per_100g: float | None = None
    confidence: str = Field(default="low", description="low | medium | high")


class SummaryOut(BaseModel):
    date: date_type
    total_kcal: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    goal: DailyGoalOut | None = None
