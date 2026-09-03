-- 005_add_meal_and_measure.sql — Agrega tipo de comida y medida de alimento.
-- Ejecutar contra Supabase vía SQL Editor (después de 001-004).

ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS measure_type TEXT NOT NULL DEFAULT 'g',
    ADD COLUMN IF NOT EXISTS measure_weight_g DOUBLE PRECISION;

ALTER TABLE food_entries
    ADD COLUMN IF NOT EXISTS meal_type TEXT;
