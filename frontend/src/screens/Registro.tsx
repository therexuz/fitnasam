import { useEffect, useState } from "react";
import { api, type Food } from "../api";
import { fmt, parseNum } from "../utils";
import type { Tab } from "../types";

export default function Registro({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
  }, [query]);

  const gramsNum = parseNum(grams) ?? 0;
  const preview =
    selected && gramsNum > 0
      ? {
          kcal: (selected.kcal_per_100g * gramsNum) / 100,
          protein_g: (selected.protein_per_100g * gramsNum) / 100,
          carbs_g: (selected.carbs_per_100g * gramsNum) / 100,
          fat_g: (selected.fat_per_100g * gramsNum) / 100,
        }
      : null;

  async function handleAdd() {
    if (!selected) {
      setError("Selecciona un alimento.");
      return;
    }
    if (gramsNum <= 0) {
      setError("Ingresa los gramos consumidos.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.createFoodEntry({ food_id: selected.id, grams: gramsNum });
      setMessage(`${selected.name} registrado.`);
      setGrams("");
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
          <span className="muted"> por 100 g: {fmt(selected.kcal_per_100g)} kcal</span>
          <button className="link-btn" onClick={() => setSelected(null)}>
            Cambiar
          </button>
        </div>
      )}

      {!selected && (
        <div className="food-list">
          {loading && <p className="muted">Buscando…</p>}
          {!loading && foods.length === 0 && (
            <p className="muted">No hay alimentos. Crea uno en Escanear.</p>
          )}
          {foods.map((f) => (
            <button
              key={f.id}
              className="card food-item"
              onClick={() => {
                setSelected(f);
                setQuery("");
              }}
            >
              <span>{f.name}</span>
              <span className="muted">{fmt(f.kcal_per_100g)} kcal / 100 g</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="card">
          <label className="field-label">Gramos consumidos</label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="Ej: 150"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
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
