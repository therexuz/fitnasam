import { useState } from "react";
import { api, type NutritionCalcResult } from "../api";
import { fmt, parseNum, todayISO } from "../utils";

const ACTIVITY = [
  { value: "1.2", label: "Sedentario (poco o nada de ejercicio)" },
  { value: "1.375", label: "Ligero (1-3 días/semana)" },
  { value: "1.55", label: "Moderado (3-5 días/semana)" },
  { value: "1.725", label: "Intenso (6-7 días/semana)" },
  { value: "1.9", label: "Atleta (entrenamiento doble)" },
];

const PROTEIN = [
  { value: "1.6", label: "1.6 g/kg (mantención)" },
  { value: "1.8", label: "1.8 g/kg (recomposición)" },
  { value: "2.0", label: "2.0 g/kg (recomposición)" },
  { value: "2.2", label: "2.2 g/kg (máxima)" },
];

export default function Perfil({ onLogout }: { onLogout?: () => void }) {
  const [sexo, setSexo] = useState("hombre");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [edad, setEdad] = useState("");
  const [factor, setFactor] = useState("1.375");
  const [deficit, setDeficit] = useState("15");
  const [protein, setProtein] = useState("2.0");
  const [result, setResult] = useState<NutritionCalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCalculate() {
    const pesoKg = parseNum(peso);
    const alturaCm = parseNum(altura);
    const edadN = parseNum(edad);
    const factorN = parseNum(factor);
    if (pesoKg == null || pesoKg <= 0) {
      setError("Ingresa un peso válido.");
      return;
    }
    if (alturaCm == null || alturaCm <= 0) {
      setError("Ingresa una altura válida.");
      return;
    }
    if (edadN == null || edadN <= 0) {
      setError("Ingresa una edad válida.");
      return;
    }
    if (factorN == null) {
      setError("Selecciona tu nivel de actividad.");
      return;
    }
    const deficitN = parseNum(deficit);
    if (deficitN == null || deficitN < 0 || deficitN > 30) {
      setError("Ingresa un déficit válido (0 a 30%).");
      return;
    }
    const proteinN = parseNum(protein);
    if (proteinN == null || proteinN < 1.6 || proteinN > 2.2) {
      setError("Ingresa una proteína válida (1.6 a 2.2 g/kg).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setMessage(null);
    try {
      const r = await api.calculateGoals({
        sexo,
        peso_kg: pesoKg,
        altura_cm: alturaCm,
        edad: Math.round(edadN),
        factor_actividad: factorN,
        deficit_percent: deficitN,
        protein_per_kg: proteinN,
      });
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.upsertGoal({
        date: todayISO(),
        kcal_target: result.kcal_target,
        protein_target_g: result.protein_g,
        carbs_target_g: result.carbs_g,
        fat_target_g: result.fat_g,
        deficit_percent: result.deficit_percent,
      });
      setMessage("Meta guardada para hoy.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Perfil y objetivos</h1>
      </header>

      <div className="card">
        <label className="field-label">Sexo</label>
        <select
          className="input"
          value={sexo}
          onChange={(e) => setSexo(e.target.value)}
        >
          <option value="hombre">Hombre</option>
          <option value="mujer">Mujer</option>
        </select>

        <label className="field-label">Peso (kg)</label>
        <input
          className="input"
          inputMode="decimal"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          placeholder="Ej: 75"
        />

        <label className="field-label">Altura (cm)</label>
        <input
          className="input"
          inputMode="decimal"
          value={altura}
          onChange={(e) => setAltura(e.target.value)}
          placeholder="Ej: 175"
        />

        <label className="field-label">Edad</label>
        <input
          className="input"
          inputMode="numeric"
          value={edad}
          onChange={(e) => setEdad(e.target.value)}
          placeholder="Ej: 30"
        />

        <label className="field-label">Nivel de actividad</label>
        <select
          className="input"
          value={factor}
          onChange={(e) => setFactor(e.target.value)}
        >
          {ACTIVITY.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        <label className="field-label">Déficit calórico (%)</label>
        <input
          className="input"
          inputMode="decimal"
          value={deficit}
          onChange={(e) => setDeficit(e.target.value)}
          placeholder="Ej: 15"
        />

        <label className="field-label">Proteína (g por kg de peso)</label>
        <select
          className="input"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        >
          {PROTEIN.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <button className="btn" onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculando…" : "Calcular metas"}
        </button>
      </div>

      {result && (
        <div className="card">
          <h2 className="section-title">Resultado</h2>
          <dl className="result-list">
            <div>
              <dt>IMC</dt>
              <dd>{fmt(result.bmi)}</dd>
            </div>
            <div>
              <dt>TMB</dt>
              <dd>{fmt(result.tmb)} kcal</dd>
            </div>
            <div>
              <dt>TDEE</dt>
              <dd>{fmt(result.tdee)} kcal</dd>
            </div>
            <div>
              <dt>Déficit aplicado</dt>
              <dd>{fmt(result.deficit_percent)} %</dd>
            </div>
            <div>
              <dt>Meta calórica</dt>
              <dd>{fmt(result.kcal_target)} kcal</dd>
            </div>
            <div>
              <dt>Proteína</dt>
              <dd>{fmt(result.protein_g)} g</dd>
            </div>
            <div>
              <dt>Carbohidratos</dt>
              <dd>{fmt(result.carbs_g)} g</dd>
            </div>
            <div>
              <dt>Grasa</dt>
              <dd>{fmt(result.fat_g)} g</dd>
            </div>
          </dl>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar meta para hoy"}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {onLogout && (
        <button className="btn btn-outline" onClick={onLogout}>
          Cerrar sesión
        </button>
      )}
    </section>
  );
}
