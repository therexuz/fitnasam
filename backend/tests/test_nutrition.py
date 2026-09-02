"""Tests de las funciones puras de cálculo nutricional (app/services/nutrition.py)."""

import pytest

from app.services import nutrition


def test_bmi():
    assert nutrition.bmi(70, 175) == pytest.approx(22.9, abs=0.1)


def test_tmb_hombre():
    tmb = nutrition.tmb("hombre", 70, 175, 30)
    assert tmb == pytest.approx(10 * 70 + 6.25 * 175 - 5 * 30 + 5)


def test_tmb_mujer():
    tmb = nutrition.tmb("mujer", 60, 165, 30)
    assert tmb == pytest.approx(10 * 60 + 6.25 * 165 - 5 * 30 - 161)


def test_tdee():
    assert nutrition.tdee(1700, 1.55) == pytest.approx(2635.0, abs=0.1)


def test_macro_targets_deficit_default_15():
    targets = nutrition.macro_targets(80, 2800)
    assert targets["kcal"] == pytest.approx(2380.0, abs=0.1)
    assert targets["protein_g"] == pytest.approx(160.0, abs=0.1)
    assert targets["fat_g"] == pytest.approx(64.0, abs=0.1)
    expected_carbs = (2380 - 160 * 4 - 64 * 9) / 4
    assert targets["carbs_g"] == pytest.approx(expected_carbs, abs=0.1)
    assert targets["carbs_g"] >= 0


def test_macro_targets_deficit_custom_20():
    targets = nutrition.macro_targets(80, 2800, 0.20)
    assert targets["kcal"] == pytest.approx(2240.0, abs=0.1)
    assert targets["protein_g"] == pytest.approx(160.0, abs=0.1)
    assert targets["fat_g"] == pytest.approx(64.0, abs=0.1)
    expected_carbs = (2240 - 160 * 4 - 64 * 9) / 4
    assert targets["carbs_g"] == pytest.approx(expected_carbs, abs=0.1)


def test_macro_targets_zero_deficit():
    targets = nutrition.macro_targets(80, 2800, 0.0)
    assert targets["kcal"] == pytest.approx(2800.0, abs=0.1)


def test_rule_of_three_half_portion():
    food = {
        "kcal_per_100g": 200,
        "protein_per_100g": 10,
        "carbs_per_100g": 30,
        "fat_per_100g": 5,
    }
    result = nutrition.rule_of_three(food, 50)
    assert result["kcal"] == pytest.approx(100.0, abs=0.1)
    assert result["protein_g"] == pytest.approx(5.0, abs=0.1)
    assert result["carbs_g"] == pytest.approx(15.0, abs=0.1)
    assert result["fat_g"] == pytest.approx(2.5, abs=0.1)


def test_rule_of_three_rounding():
    food = {
        "kcal_per_100g": 33,
        "protein_per_100g": 2.2,
        "carbs_per_100g": 5.7,
        "fat_per_100g": 0.1,
    }
    result = nutrition.rule_of_three(food, 33.3)
    assert result["kcal"] == pytest.approx(10.99, abs=0.1)
