import { useState } from "react";
import { api, type MeasureType } from "../api";
import { fmt, parseNum } from "../utils";
import type { Tab } from "../types";

interface Form {
  name: string;
  portionBase: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  fibre: string;
  sugar: string;
  measureType: MeasureType;
  measureWeight: string;
}

const emptyForm: Form = {
  name: "",
  portionBase: "100",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  sodium: "",
  fibre: "",
  sugar: "",
  measureType: "g",
  measureWeight: "",
};

const fields: { key: keyof Form; label: string; optional?: boolean }[] = [
  { key: "kcal", label: "Calorías (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
  { key: "sodium", label: "Sodio (mg)", optional: true },
  { key: "fibre", label: "Fibra (g)", optional: true },
  { key: "sugar", label: "Azúcar (g)", optional: true },
];

const MEASURES: { value: MeasureType; label: string }[] = [
  { value: "g", label: "Gramos (100 g)" },
  { value: "unidad", label: "Por unidad (ej: huevo)" },
  { value: "ml", label: "Mililitros (líquido)" },
];

export default function Alimento({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const portionBase = parseNum(form.portionBase);
  const factor = portionBase && portionBase > 0 ? 100 / portionBase : 1;

  function normalize(v: number | null): number | null {
    if (v == null) return null;
    return v * factor;
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError("Ingresa un nombre para el alimento.");
      return;
    }
    if (portionBase == null || portionBase <= 0) {
      setError("Ingresa los gramos de la porción.");
      return;
    }
    const kcal = normalize(parseNum(form.kcal));
    const protein = normalize(parseNum(form.protein));
    const carbs = normalize(parseNum(form.carbs));
    const fat = normalize(parseNum(form.fat));
    if (kcal == null && protein == null && carbs == null && fat == null) {
      setError("Ingresa al menos una macro o las calorías.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.createFood({
        name,
        kcal_per_100g: kcal ?? 0,
        protein_per_100g: protein ?? 0,
        carbs_per_100g: carbs ?? 0,
        fat_per_100g: fat ?? 0,
        sodium_mg_per_100g: normalize(parseNum(form.sodium)),
        fibre_g_per_100g: normalize(parseNum(form.fibre)),
        sugar_g_per_100g: normalize(parseNum(form.sugar)),
        standard_portion_g: portionBase,
        measure_type: form.measureType,
        measure_weight_g:
          form.measureType !== "g" ? parseNum(form.measureWeight) : null,
      });
      setMessage(`"${name}" guardado.`);
      setForm(emptyForm);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Agregar alimento</h1>
      </header>

      <p className="muted">
        Ingresa la porción que sueles consumir y sus valores. Internamente se
        normaliza a 100 g.
      </p>

      <div className="card">
        <label className="field-label">Nombre</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Yogur protein"
        />

        <label className="field-label">Porción habitual (g)</label>
        <input
          className="input"
          inputMode="decimal"
          value={form.portionBase}
          onChange={(e) => update("portionBase", e.target.value)}
          placeholder="Ej: 120"
        />

        <p className="muted">
          Los valores siguientes son de tu porción de{" "}
          {portionBase && portionBase > 0 ? fmt(portionBase) : "—"} g.
        </p>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="field-label">
              {f.label}
              {f.optional && <span className="muted"> (opcional)</span>}
            </label>
            <input
              className="input"
              inputMode="decimal"
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </div>
        ))}

        <label className="field-label">Medida al registrar</label>
        <select
          className="input"
          value={form.measureType}
          onChange={(e) => update("measureType", e.target.value as MeasureType)}
        >
          {MEASURES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {form.measureType !== "g" && (
          <>
            <label className="field-label">
              {form.measureType === "unidad"
                ? "Gramos por unidad"
                : "Gramos por ml"}
            </label>
            <input
              className="input"
              inputMode="decimal"
              value={form.measureWeight}
              onChange={(e) => update("measureWeight", e.target.value)}
              placeholder="Ej: 50"
            />
          </>
        )}

        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar alimento"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <button
        className="btn btn-outline"
        onClick={() => onNavigate("registro")}
      >
        Ir a registrar consumo
      </button>
    </section>
  );
}
