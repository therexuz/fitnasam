import { useEffect, useState } from "react";
import { api, type FoodEntry, type Summary } from "../api";
import ProgressBar from "../components/ProgressBar";
import { fmt, todayISO } from "../utils";
import type { Tab } from "../types";

export default function Resumen({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.getSummary(date), api.listFoodEntries(date)])
      .then(([s, e]) => {
        if (cancelled) return;
        setSummary(s);
        setEntries(e);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, refreshing]);

  async function handleDeleteEntry(entryId: number) {
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      await api.deleteFoodEntry(entryId);
      setRefreshing((r) => !r);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const goal = summary?.goal ?? null;

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Resumen</h1>
        <input
          type="date"
          className="date-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </header>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {!goal && (
            <div className="card banner">
              <p>Aún no defines tu meta del día.</p>
              <button
                className="btn btn-outline"
                onClick={() => onNavigate("perfil")}
              >
                Configurar meta
              </button>
            </div>
          )}

          {goal && summary && (
            <div className="card">
              <ProgressBar
                label="Calorías"
                value={summary.total_kcal}
                target={goal.kcal_target}
                unit="kcal"
                color="kcal"
              />
              <ProgressBar
                label="Proteína"
                value={summary.total_protein_g}
                target={goal.protein_target_g}
                unit="g"
                color="protein"
              />
              <ProgressBar
                label="Carbohidratos"
                value={summary.total_carbs_g}
                target={goal.carbs_target_g}
                unit="g"
                color="carbs"
              />
              <ProgressBar
                label="Grasa"
                value={summary.total_fat_g}
                target={goal.fat_target_g}
                unit="g"
                color="fat"
              />
            </div>
          )}

          <h2 className="section-title">Comidas del día</h2>
          {entries.length === 0 ? (
            <p className="muted">Sin registros todavía. Agrega tu primera comida.</p>
          ) : (
            <ul className="entry-list">
              {entries.map((e) => (
                <li key={e.id} className="card entry">
                  <div className="entry-head">
                    <div>
                      <strong>{e.food_name}</strong>
                      <span className="muted"> {fmt(e.grams)} g</span>
                      {e.meal_type && (
                        <span className="muted"> · {e.meal_type}</span>
                      )}
                    </div>
                    <button
                      className="link-btn delete-btn"
                      onClick={() => handleDeleteEntry(e.id)}
                      aria-label="Eliminar registro"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="entry-macros">
                    <span>{fmt(e.kcal)} kcal</span>
                    <span className="muted">
                      P {fmt(e.protein_g)} · C {fmt(e.carbs_g)} · G {fmt(e.fat_g)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
