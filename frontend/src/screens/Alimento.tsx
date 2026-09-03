import { useState } from "react";
import { api, type MeasureType } from "../api";
import { parseNum } from "../utils";
import type { Tab } from "../types";

interface Form {
  name: string;
  referenceWeight: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  fibre: string;
  sugar: string;
  measureType: MeasureType;
}

const emptyForm: Form = {
  name: "",
  referenceWeight: "",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  sodium: "",
  fibre: "",
  sugar: "",
  measureType: "unidad",
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
  { value: "unidad", label: "Por unidad (huevo, plátano…)" },
  { value: "g", label: "Gramos" },
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

  const isCount = form.measureType !== "g";
  const referenceWeight = parseNum(form.referenceWeight);
  const factor =
    referenceWeight && referenceWeight > 0 ? 100 / referenceWeight : 1;

  function normalize(v: number | null): number | null {
    if (v == null) return null;
    return v * factor;
  }

  const unitLabel =
    form.measureType === "unidad"
      ? "1 unidad"
      : form.measureType === "ml"
        ? "1 ml"
        : "1 g";

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError("Ingresa un nombre para el alimento.");
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
    if (isCount && (referenceWeight == null || referenceWeight <= 0)) {
      setError("Ingresa el peso de 1 " + form.measureType + " en gramos.");
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
        standard_portion_g: isCount ? referenceWeight : referenceWeight || null,
        measure_type: form.measureType,
        measure_weight_g: isCount ? referenceWeight : null,
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
        Indica cómo lo mides y los valores de una porción. Todo se normaliza a
        100 g internamente.
      </p>

      <div className="card">
        <label className="field-label">Nombre</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Huevo Tottus"
        />

        <label className="field-label">Medida</label>
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

        <label className="field-label">
          {form.measureType === "unidad"
            ? "Peso de 1 unidad (g)"
            : form.measureType === "ml"
              ? "Peso de 1 ml (g)"
              : "Peso de la porción (g)"}
        </label>
        <input
          className="input"
          inputMode="decimal"
          value={form.referenceWeight}
          onChange={(e) => update("referenceWeight", e.target.value)}
          placeholder={
            form.measureType === "unidad"
              ? "Ej: 51"
              : form.measureType === "ml"
                ? "Ej: 1"
                : "Ej: 120"
          }
        />

        <p className="muted">
          Los valores siguientes son de {unitLabel}.
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
