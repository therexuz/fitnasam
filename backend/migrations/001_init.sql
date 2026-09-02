-- 001_init.sql — migración inicial de fitnasam
-- Ejecutar contra Supabase vía SQL Editor (o runner local).

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foods (
    id                   SERIAL PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 TEXT NOT NULL,
    kcal_per_100g        DOUBLE PRECISION NOT NULL,
    protein_per_100g     DOUBLE PRECISION NOT NULL,
    carbs_per_100g       DOUBLE PRECISION NOT NULL,
    fat_per_100g         DOUBLE PRECISION NOT NULL,
    sodium_mg_per_100g   DOUBLE PRECISION,
    fibre_g_per_100g     DOUBLE PRECISION,
    sugar_g_per_100g     DOUBLE PRECISION,
    standard_portion_g   DOUBLE PRECISION,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id);

CREATE TABLE IF NOT EXISTS food_entries (
    id           SERIAL PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id      INT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    grams        DOUBLE PRECISION NOT NULL,
    consumed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    date         DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);

CREATE TABLE IF NOT EXISTS daily_goals (
    id               SERIAL PRIMARY KEY,
    user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date             DATE NOT NULL,
    kcal_target      DOUBLE PRECISION NOT NULL,
    protein_target_g DOUBLE PRECISION NOT NULL,
    carbs_target_g   DOUBLE PRECISION NOT NULL,
    fat_target_g     DOUBLE PRECISION NOT NULL,
    CONSTRAINT uq_daily_goals_user_date UNIQUE (user_id, date)
);

-- RLS: habilitar en 002_rls.sql (junto con políticas y revoke de PostgREST).
