"""Endpoints de la API de fitnasam."""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id_required
from app.core.database import get_db
from app.models import Food, FoodEntry, DailyGoal, User
from app.schemas import (
    DailyGoalCreate,
    DailyGoalOut,
    FoodCreate,
    FoodEntryCreate,
    FoodEntryOut,
    FoodOut,
    MacroTargetsRequest,
    NutritionCalcResult,
    OCRResult,
    PortionRequest,
    PortionResult,
    SummaryOut,
)
from app.services import nutrition
from app.services.ocr import extract_nutrition

router = APIRouter()


async def _ensure_user(db: AsyncSession, user_id: str) -> User:
    user = await db.get(User, user_id)
    if user is None:
        user = User(id=user_id, email=f"{user_id}@fitnasam.local")
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


@router.post("/foods", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
async def create_food(
    payload: FoodCreate,
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user(db, user_id)
    if (
        payload.kcal_per_100g == 0
        and payload.protein_per_100g == 0
        and payload.carbs_per_100g == 0
        and payload.fat_per_100g == 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El alimento no puede tener todos los macros en 0",
        )
    food = Food(user_id=user_id, **payload.model_dump())
    db.add(food)
    await db.commit()
    await db.refresh(food)
    return food


@router.get("/foods", response_model=list[FoodOut])
async def list_foods(
    q: str = Query(default=None),
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Food).where(Food.user_id == user_id)
    if q:
        stmt = stmt.where(Food.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Food.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/food-entries", response_model=FoodEntryOut, status_code=status.HTTP_201_CREATED)
async def create_food_entry(
    payload: FoodEntryCreate,
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user(db, user_id)
    food = await db.get(Food, payload.food_id)
    if food is None or food.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alimento no encontrado"
        )

    macros = nutrition.rule_of_three(
        {
            "kcal_per_100g": food.kcal_per_100g,
            "protein_per_100g": food.protein_per_100g,
            "carbs_per_100g": food.carbs_per_100g,
            "fat_per_100g": food.fat_per_100g,
        },
        payload.grams,
    )

    entry = FoodEntry(
        user_id=user_id,
        food_id=food.id,
        grams=payload.grams,
        date=payload.date or datetime.now(timezone.utc).date(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return FoodEntryOut(
        id=entry.id,
        user_id=entry.user_id,
        food_id=entry.food_id,
        grams=entry.grams,
        consumed_at=entry.consumed_at,
        date=entry.date,
        kcal=macros["kcal"],
        protein_g=macros["protein_g"],
        carbs_g=macros["carbs_g"],
        fat_g=macros["fat_g"],
        food_name=food.name,
    )


@router.get("/food-entries", response_model=list[FoodEntryOut])
async def list_food_entries(
    date: date = Query(...),
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(FoodEntry, Food)
        .join(Food, FoodEntry.food_id == Food.id)
        .where(FoodEntry.user_id == user_id, FoodEntry.date == date)
        .order_by(FoodEntry.consumed_at)
    )
    result = await db.execute(stmt)
    rows = result.all()
    out = []
    for entry, food in rows:
        macros = nutrition.rule_of_three(
            {
                "kcal_per_100g": food.kcal_per_100g,
                "protein_per_100g": food.protein_per_100g,
                "carbs_per_100g": food.carbs_per_100g,
                "fat_per_100g": food.fat_per_100g,
            },
            entry.grams,
        )
        out.append(
            FoodEntryOut(
                id=entry.id,
                user_id=entry.user_id,
                food_id=entry.food_id,
                grams=entry.grams,
                consumed_at=entry.consumed_at,
                date=entry.date,
                kcal=macros["kcal"],
                protein_g=macros["protein_g"],
                carbs_g=macros["carbs_g"],
                fat_g=macros["fat_g"],
                food_name=food.name,
            )
        )
    return out


@router.get("/summary", response_model=SummaryOut)
async def get_summary(
    date: date = Query(...),
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(FoodEntry, Food)
        .join(Food, FoodEntry.food_id == Food.id)
        .where(FoodEntry.user_id == user_id, FoodEntry.date == date)
    )
    result = await db.execute(stmt)
    rows = result.all()

    total_kcal = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    for entry, food in rows:
        macros = nutrition.rule_of_three(
            {
                "kcal_per_100g": food.kcal_per_100g,
                "protein_per_100g": food.protein_per_100g,
                "carbs_per_100g": food.carbs_per_100g,
                "fat_per_100g": food.fat_per_100g,
            },
            entry.grams,
        )
        total_kcal += macros["kcal"]
        total_protein += macros["protein_g"]
        total_carbs += macros["carbs_g"]
        total_fat += macros["fat_g"]

    goal_stmt = select(DailyGoal).where(
        DailyGoal.user_id == user_id, DailyGoal.date == date
    )
    goal_result = await db.execute(goal_stmt)
    goal = goal_result.scalar_one_or_none()

    return SummaryOut(
        date=date,
        total_kcal=round(total_kcal, 1),
        total_protein_g=round(total_protein, 1),
        total_carbs_g=round(total_carbs, 1),
        total_fat_g=round(total_fat, 1),
        goal=DailyGoalOut.model_validate(goal) if goal else None,
    )


@router.put("/goals", response_model=DailyGoalOut)
async def upsert_goal(
    payload: DailyGoalCreate,
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_user(db, user_id)
    stmt = select(DailyGoal).where(
        DailyGoal.user_id == user_id, DailyGoal.date == payload.date
    )
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()

    if goal is None:
        goal = DailyGoal(user_id=user_id, **payload.model_dump())
        db.add(goal)
    else:
        for key, value in payload.model_dump(exclude={"date"}).items():
            setattr(goal, key, value)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.post("/calculate/goals", response_model=NutritionCalcResult)
async def calculate_goals(payload: MacroTargetsRequest):
    sexo = payload.sexo.strip().lower()
    if sexo not in ("hombre", "mujer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sexo debe ser 'hombre' o 'mujer'",
        )

    bmi_value = nutrition.bmi(payload.peso_kg, payload.altura_cm)
    tmb_value = nutrition.tmb(sexo, payload.peso_kg, payload.altura_cm, payload.edad)
    tdee_value = nutrition.tdee(tmb_value, payload.factor_actividad)
    targets = nutrition.macro_targets(payload.peso_kg, tdee_value)

    return NutritionCalcResult(
        bmi=bmi_value,
        tmb=round(tmb_value, 1),
        tdee=round(tdee_value, 1),
        kcal_target=targets["kcal"],
        protein_g=targets["protein_g"],
        carbs_g=targets["carbs_g"],
        fat_g=targets["fat_g"],
    )


@router.post("/ocr/nutrition-label", response_model=OCRResult)
async def ocr_nutrition_label(file: UploadFile = File(...)):
    contents = await file.read()
    result = extract_nutrition(contents)
    return OCRResult(**result)


@router.post("/calculate/portion", response_model=PortionResult)
async def calculate_portion(
    payload: PortionRequest,
    user_id: str = Depends(get_current_user_id_required),
    db: AsyncSession = Depends(get_db),
):
    food = await db.get(Food, payload.food_id)
    if food is None or food.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alimento no encontrado"
        )

    macros = nutrition.rule_of_three(
        {
            "kcal_per_100g": food.kcal_per_100g,
            "protein_per_100g": food.protein_per_100g,
            "carbs_per_100g": food.carbs_per_100g,
            "fat_per_100g": food.fat_per_100g,
        },
        payload.grams,
    )

    return PortionResult(
        food_id=food.id,
        grams=payload.grams,
        kcal=macros["kcal"],
        protein_g=macros["protein_g"],
        carbs_g=macros["carbs_g"],
        fat_g=macros["fat_g"],
    )
