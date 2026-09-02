-- 004_add_deficit.sql — Agrega la columna deficit_percent a daily_goals.
-- Ejecutar contra Supabase vía SQL Editor (después de 001/002/003).

ALTER TABLE daily_goals
    ADD COLUMN IF NOT EXISTS deficit_percent DOUBLE PRECISION NOT NULL DEFAULT 0;
