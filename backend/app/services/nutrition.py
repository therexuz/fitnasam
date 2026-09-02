"""Funciones puras de cálculo nutricional (Mifflin-St Jeor, regla de 3, metas)."""


def bmi(peso_kg: float, altura_cm: float) -> float:
    m = altura_cm / 100
    return round(peso_kg / (m * m), 1)


def tmb(sexo: str, peso_kg: float, altura_cm: float, edad: int) -> float:
    base = 10 * peso_kg + 6.25 * altura_cm - 5 * edad
    if sexo.strip().lower() == "mujer":
        return base - 161
    return base + 5


def tdee(tmb: float, factor_actividad: float) -> float:
    return tmb * factor_actividad


def macro_targets(peso_kg: float, tdee: float) -> dict:
    kcal = tdee * 0.85
    protein_g = peso_kg * 2.0
    fat_g = peso_kg * 0.8
    carbs_g = (kcal - protein_g * 4 - fat_g * 9) / 4
    if carbs_g < 0:
        carbs_g = 0.0
    return {
        "kcal": round(kcal, 1),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
    }


def rule_of_three(food_macros_100g: dict, grams: float) -> dict:
    factor = grams / 100
    return {
        "kcal": round(food_macros_100g["kcal_per_100g"] * factor, 1),
        "protein_g": round(food_macros_100g["protein_per_100g"] * factor, 1),
        "carbs_g": round(food_macros_100g["carbs_per_100g"] * factor, 1),
        "fat_g": round(food_macros_100g["fat_per_100g"] * factor, 1),
    }
