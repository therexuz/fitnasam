import { getSupabase } from "./supabase";

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

async function getToken(): Promise<string | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export type MeasureType = "g" | "unidad" | "ml";
export type MealType = "desayuno" | "almuerzo" | "cena" | "snack";

export interface Food {
  id: number;
  user_id: string;
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  sodium_mg_per_100g: number | null;
  fibre_g_per_100g: number | null;
  sugar_g_per_100g: number | null;
  standard_portion_g: number | null;
  measure_type: MeasureType;
  measure_weight_g: number | null;
  created_at: string;
}

export interface FoodCreate {
  name: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  sodium_mg_per_100g?: number | null;
  fibre_g_per_100g?: number | null;
  sugar_g_per_100g?: number | null;
  standard_portion_g?: number | null;
  measure_type?: MeasureType;
  measure_weight_g?: number | null;
}

export interface FoodEntry {
  id: number;
  user_id: string;
  food_id: number;
  grams: number;
  meal_type: MealType | null;
  consumed_at: string;
  date: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  food_name: string;
}

export interface DailyGoal {
  id: number;
  user_id: string;
  date: string;
  kcal_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  deficit_percent: number;
}

export interface Summary {
  date: string;
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  goal: DailyGoal | null;
}

export interface NutritionCalcResult {
  bmi: number;
  tmb: number;
  tdee: number;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  deficit_percent: number;
  protein_per_kg: number;
}

export interface OCRResult {
  portion_g: number | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  sodium_mg_per_100g: number | null;
  fibre_g_per_100g: number | null;
  sugar_g_per_100g: number | null;
  confidence: string;
}

export interface PortionResult {
  food_id: number;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = await getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  }

  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error("Sesión expirada. Inicia sesión de nuevo.");
  }

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((d: { msg?: string }) => d?.msg ?? "Datos inválidos")
        .join(". ");
    }
    return `Error del servidor (${res.status})`;
  } catch {
    return `Error del servidor (${res.status})`;
  }
}

export const api = {
  createFood(body: FoodCreate): Promise<Food> {
    return request("/foods", { method: "POST", body: JSON.stringify(body) });
  },
  listFoods(q?: string): Promise<Food[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return request(`/foods${query}`);
  },
  createFoodEntry(body: {
    food_id: number;
    grams: number;
    date?: string;
    meal_type?: MealType | null;
  }): Promise<FoodEntry> {
    return request("/food-entries", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  listFoodEntries(date: string): Promise<FoodEntry[]> {
    return request(`/food-entries?date=${encodeURIComponent(date)}`);
  },
  getSummary(date: string): Promise<Summary> {
    return request(`/summary?date=${encodeURIComponent(date)}`);
  },
  upsertGoal(body: {
    date: string;
    kcal_target: number;
    protein_target_g: number;
    carbs_target_g: number;
    fat_target_g: number;
    deficit_percent: number;
  }): Promise<DailyGoal> {
    return request("/goals", { method: "PUT", body: JSON.stringify(body) });
  },
  calculateGoals(body: {
    sexo: string;
    peso_kg: number;
    altura_cm: number;
    edad: number;
    factor_actividad: number;
    deficit_percent: number;
    protein_per_kg: number;
  }): Promise<NutritionCalcResult> {
    return request("/calculate/goals", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  ocrNutritionLabel(file: File): Promise<OCRResult> {
    const fd = new FormData();
    fd.append("file", file);
    return request("/ocr/nutrition-label", { method: "POST", body: fd });
  },
  calculatePortion(body: {
    food_id: number;
    grams: number;
  }): Promise<PortionResult> {
    return request("/calculate/portion", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
