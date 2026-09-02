"""Pipeline OCR para etiquetas nutricionales chilenas (borrador editable, nunca inventa)."""

import io
import re

from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

from app.core.config import settings


_KEYWORDS = {
    "kcal": re.compile(r"(kcal|\bcalor|energ)", re.IGNORECASE),
    "protein": re.compile(r"prote", re.IGNORECASE),
    "fat": re.compile(r"(grasa|grasas|gras)", re.IGNORECASE),
    "carbs": re.compile(r"(hidrato|carbohidrato|carboh|h\s*\.?\s*de\s*c)", re.IGNORECASE),
    "sodium": re.compile(r"sodio", re.IGNORECASE),
    "fibre": re.compile(r"fibra", re.IGNORECASE),
    "sugar": re.compile(r"az[uú]car", re.IGNORECASE),
}

_PORTION_RE = re.compile(r"porci[oó]n\s*\(?\s*(\d+(?:[.,]\d+)?)\s*\)?")
_NUMBER_RE = re.compile(r"(\d+(?:[.,]\d+)?)")


def _to_float(raw: str) -> float | None:
    if raw is None:
        return None
    cleaned = raw.replace(",", ".").replace(" ", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _preprocess(image: Image.Image) -> Image.Image:
    gray = image.convert("L")
    enhancer = ImageEnhance.Contrast(gray)
    gray = enhancer.enhance(2.0)
    gray = gray.filter(ImageFilter.MedianFilter(size=3))
    return gray.point(lambda p: 255 if p > 150 else 0)


def _parse_value(lines: list[str], key: str, portion_100g: bool) -> float | None:
    pattern = _KEYWORDS[key]
    for line in lines:
        if not pattern.search(line):
            continue
        numbers = _NUMBER_RE.findall(line)
        if not numbers:
            continue
        if portion_100g and len(numbers) >= 2:
            return _to_float(numbers[0])
        return _to_float(numbers[-1])
    return None


def extract_nutrition(image_bytes: bytes) -> dict:
    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return {"confidence": "low"}

    processed = _preprocess(image)
    lang = settings.OCR_TESSERACT_LANG or "spa"
    raw_text = pytesseract.image_to_string(processed, lang=lang, config="--psm 6")
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]

    portion_g = None
    for line in lines:
        m = _PORTION_RE.search(line)
        if m:
            portion_g = _to_float(m.group(1))
            break

    portion_100g = "\n".join(lines).lower().count("100") >= 1

    kcal = _parse_value(lines, "kcal", portion_100g)
    protein = _parse_value(lines, "protein", portion_100g)
    carbs = _parse_value(lines, "carbs", portion_100g)
    fat = _parse_value(lines, "fat", portion_100g)
    sodium = _parse_value(lines, "sodium", portion_100g)
    fibre = _parse_value(lines, "fibre", portion_100g)
    sugar = _parse_value(lines, "sugar", portion_100g)

    if not portion_100g and portion_g:
        for name, val in (
            ("kcal", kcal),
            ("protein", protein),
            ("carbs", carbs),
            ("fat", fat),
            ("sodium", sodium),
            ("fibre", fibre),
            ("sugar", sugar),
        ):
            if val is not None:
                if name == "kcal":
                    kcal = round(val * (100 / portion_g), 1)
                elif name == "protein":
                    protein = round(val * (100 / portion_g), 1)
                elif name == "carbs":
                    carbs = round(val * (100 / portion_g), 1)
                elif name == "fat":
                    fat = round(val * (100 / portion_g), 1)
                elif name == "sodium":
                    sodium = round(val * (100 / portion_g), 1)
                elif name == "fibre":
                    fibre = round(val * (100 / portion_g), 1)
                elif name == "sugar":
                    sugar = round(val * (100 / portion_g), 1)

    detected = [v for v in (kcal, protein, carbs, fat) if v is not None]
    if len(detected) >= 4:
        confidence = "high"
    elif len(detected) >= 2:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "portion_g": portion_g,
        "kcal_per_100g": kcal,
        "protein_per_100g": protein,
        "carbs_per_100g": carbs,
        "fat_per_100g": fat,
        "sodium_mg_per_100g": sodium,
        "fibre_g_per_100g": fibre,
        "sugar_g_per_100g": sugar,
        "confidence": confidence,
    }
