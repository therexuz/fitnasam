import { useRef, useState, type ChangeEvent } from "react";
import { api, type OCRResult } from "../api";
import { parseNum } from "../utils";
import type { Tab } from "../types";

interface Draft {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  fibre: string;
  sugar: string;
  portion: string;
  confidence: string;
}

function toDraft(ocr: OCRResult): Draft {
  return {
    name: "",
    kcal: ocr.kcal_per_100g != null ? String(ocr.kcal_per_100g) : "",
    protein: ocr.protein_per_100g != null ? String(ocr.protein_per_100g) : "",
    carbs: ocr.carbs_per_100g != null ? String(ocr.carbs_per_100g) : "",
    fat: ocr.fat_per_100g != null ? String(ocr.fat_per_100g) : "",
    sodium: ocr.sodium_mg_per_100g != null ? String(ocr.sodium_mg_per_100g) : "",
    fibre: ocr.fibre_g_per_100g != null ? String(ocr.fibre_g_per_100g) : "",
    sugar: ocr.sugar_g_per_100g != null ? String(ocr.sugar_g_per_100g) : "",
    portion: ocr.portion_g != null ? String(ocr.portion_g) : "",
    confidence: ocr.confidence,
  };
}

const fields: { key: keyof Draft; label: string; optional?: boolean }[] = [
  { key: "kcal", label: "Calorías (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Carbohidratos (g)" },
  { key: "fat", label: "Grasa (g)" },
  { key: "sodium", label: "Sodio (mg)", optional: true },
  { key: "fibre", label: "Fibra (g)", optional: true },
  { key: "sugar", label: "Azúcar (g)", optional: true },
  { key: "portion", label: "Porción estándar (g)", optional: true },
];

const confidenceLabel: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export default function Escaneo({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    setError(null);
    setMessage(null);
    setDraft(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    try {
      const result = await api.ocrNutritionLabel(file);
      setDraft(toDraft(result));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  function update(field: keyof Draft, value: string) {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  }

  async function handleSave() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setError("Ingresa un nombre para el alimento.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.createFood({
        name,
        kcal_per_100g: parseNum(draft.kcal) ?? 0,
        protein_per_100g: parseNum(draft.protein) ?? 0,
        carbs_per_100g: parseNum(draft.carbs) ?? 0,
        fat_per_100g: parseNum(draft.fat) ?? 0,
        sodium_mg_per_100g: parseNum(draft.sodium),
        fibre_g_per_100g: parseNum(draft.fibre),
        sugar_g_per_100g: parseNum(draft.sugar),
        standard_portion_g: parseNum(draft.portion),
      });
      setMessage("Alimento guardado.");
      setDraft(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      onNavigate("registro");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <header className="screen-header">
        <h1>Escanear etiqueta</h1>
      </header>

      <div className="scan-actions">
        <button className="btn" onClick={() => cameraRef.current?.click()}>
          Tomar foto
        </button>
        <button className="btn btn-outline" onClick={() => galleryRef.current?.click()}>
          Elegir archivo
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />

      {previewUrl && (
        <img className="preview-img" src={previewUrl} alt="Etiqueta" />
      )}
      {processing && <p className="muted">Procesando imagen…</p>}

      {draft && (
        <div className="card">
          <p className="muted">
            Revisa y corrige los valores antes de guardar (base 100 g).
          </p>
          <p className="muted">
            Confianza: {confidenceLabel[draft.confidence] ?? draft.confidence}
          </p>

          <label className="field-label">Nombre</label>
          <input
            className="input"
            value={draft.name}
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
                value={draft[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </div>
          ))}

          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar alimento"}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </section>
  );
}
