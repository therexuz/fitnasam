import { useState } from "react";
import { api } from "../api";
import { parseNum } from "../utils";
import type { Tab } from "../types";

interface Form {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  fibre: string;
  sugar: string;
  portion: string;
}

const emptyForm: Form = {
  name: "",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  sodium: "",
  fibre: "",
  sugar: "",
  portion: "",
};

const fields: { key: keyof Form; label: string; optional?: boolean }[] = [
  { key: "kcal", label: "Calorías (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
  { key: "sodium", label: "Sodio (mg)", optional: true },
  { key: "fibre", label: "Fibra (g)", optional: true },
  { key: "sugar", label: "Azúcar (g)", optional: true },
  { key: "portion", label: "Porción estándar (g)", optional: true },
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

  function update(key: keyof Form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError("Ingresa un nombre para el alimento.");
      return;
    }
    const kcal = parseNum(form.kcal);
    const protein = parseNum(form.protein);
    const carbs = parseNum(form.carbs);
    const fat = parseNum(form.fat);
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
        sodium_mg_per_100g: parseNum(form.sodium),
        fibre_g_per_100g: parseNum(form.fibre),
        sugar_g_per_100g: parseNum(form.sugar),
        standard_portion_g: parseNum(form.portion),
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

      <p className="muted">Ingresa los valores por 100 g del producto.</p>

      <div className="card">
        <label className="field-label">Nombre</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ej: Yogur natural"
        />

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
