import { useEffect, useState } from "react";
import { api, type Food, type MealType } from "../api";
import { fmt, parseNum, todayISO } from "../utils";
import type { Tab } from "../types";

const MEALS: { value: MealType; label: string }[] = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "cena", label: "Cena" },
  { value: "snack", label: "Snack" },
];

const measureLabel: Record<string, string> = {
  g: "g",
  unidad: "unidad(es)",
  ml: "ml",
};

export default function Registro({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState("");
  const [mealType, setMealType] = useState<MealType>("almuerzo");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      api
        .listFoods(query.trim() || undefined)
        .then((f) => {
          if (!cancelled) setFoods(f);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, refreshing]);

  async function handleDeleteFood(food: Food) {
    if (!window.confirm(`¿Eliminar "${food.name}" y sus registros?`)) return;
    try {
      await api.deleteFood(food.id);
      setSelected(null);
      setRefreshing((r) => !r);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const qtyNum = parseNum(qty) ?? 0;

  const unitWeight = selected?.measure_weight_g ?? selected?.standard_portion_g ?? null;

  const grams =
    selected && selected.measure_type !== "g" && unitWeight
      ? qtyNum * unitWeight
      : qtyNum;

  const preview =
    selected && grams > 0
      ? {
          kcal: (selected.kcal_per_100g * grams) / 100,
          protein_g: (selected.protein_per_100g * grams) / 100,
          carbs_g: (selected.carbs_per_100g * grams) / 100,
          fat_g: (selected.fat_per_100g * grams) / 100,
        }
      : null;

  function resetAfterAdd() {
    setSelected(null);
    setQty("");
    setQuery("");
  }

  async function handleAdd() {
    if (!selected) {
      setError("Selecciona un alimento.");
      return;
    }
    if (qtyNum <= 0) {
      setError("Ingresa la cantidad a registrar.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.createFoodEntry({
        food_id: selected.id,
        grams,
        date: todayISO(),
        meal_type: mealType,
      });
      setMessage(`${selected.name} registrado.`);
      resetAfterAdd();
      onNavigate("resumen");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Registrar comida</h1>
      </header>

      <input
        type="search"
        className="input"
        placeholder="Buscar alimento…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {selected && (
        <div className="card selected-food">
          <strong>{selected.name}</strong>
          <span className="muted">
            {selected.measure_type === "g"
              ? `por 100 g: ${fmt(selected.kcal_per_100g)} kcal`
              : unitWeight
                ? `por 1 ${measureLabel[selected.measure_type]}: ${fmt(
                    (selected.kcal_per_100g * unitWeight) / 100,
                  )} kcal`
                : `por 100 g: ${fmt(selected.kcal_per_100g)} kcal`}
          </span>
          <button className="link-btn" onClick={() => setSelected(null)}>
            Cambiar
          </button>
        </div>
      )}

      {!selected && (
        <div className="food-list">
          {loading && <p className="muted">Buscando…</p>}
          {!loading && foods.length === 0 && (
            <p className="muted">No hay alimentos. Crea uno en Alimento o Escanear.</p>
          )}
          {foods.map((f) => (
            <div key={f.id} className="card food-item">
              <button
                className="food-item-main"
                onClick={() => {
                  setSelected(f);
                  setQuery("");
                  setQty("");
                }}
              >
                <span>{f.name}</span>
                <span className="muted">
                  {f.measure_type === "g"
                    ? `${fmt(f.kcal_per_100g)} kcal / 100 g`
                    : f.measure_weight_g ?? f.standard_portion_g
                      ? `${fmt(
                          (f.kcal_per_100g *
                            (f.measure_weight_g ?? f.standard_portion_g ?? 0)) /
                            100,
                        )} kcal / 1 ${measureLabel[f.measure_type]}`
                      : `${fmt(f.kcal_per_100g)} kcal / 100 g`}
                </span>
              </button>
              <button
                className="link-btn delete-btn"
                onClick={() => handleDeleteFood(f)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card">
          <label className="field-label">Tipo de comida</label>
          <select
            className="input"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
          >
            {MEALS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <label className="field-label">
            Cantidad ({measureLabel[selected.measure_type]})
          </label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder={
              selected.measure_type === "g"
                ? "Ej: 150"
                : selected.measure_type === "unidad"
                  ? "Ej: 2"
                  : "Ej: 250"
            }
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />

          {selected.measure_type === "g" && selected.standard_portion_g && (
            <button
              className="link-btn"
              onClick={() => setQty(String(selected.standard_portion_g))}
            >
              Usar porción ({fmt(selected.standard_portion_g)} g)
            </button>
          )}

          {selected.measure_type !== "g" && (
            <button
              className="link-btn"
              onClick={() => setQty("1")}
            >
              Usar 1 {measureLabel[selected.measure_type]}
            </button>
          )}

          {selected.measure_type !== "g" && unitWeight && (
            <p className="muted">
              {fmt(qtyNum)} {measureLabel[selected.measure_type]} ≈ {fmt(grams)} g
            </p>
          )}

          {preview && (
            <div className="preview">
              <div>
                <span className="muted">Calorías</span>
                <strong>{fmt(preview.kcal)} kcal</strong>
              </div>
              <div>
                <span className="muted">Proteína</span>
                <strong>{fmt(preview.protein_g)} g</strong>
              </div>
              <div>
                <span className="muted">Carbohidratos</span>
                <strong>{fmt(preview.carbs_g)} g</strong>
              </div>
              <div>
                <span className="muted">Grasa</span>
                <strong>{fmt(preview.fat_g)} g</strong>
              </div>
            </div>
          )}

          <button className="btn" onClick={handleAdd} disabled={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </section>
  );
}
