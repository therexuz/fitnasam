-- 002_rls.sql — Habilita Row Level Security y revoca exposición por PostgREST.
-- Ejecutar contra Supabase vía SQL Editor (después de 001_init.sql).

-- El backend FastAPI accede con el role de servicio (SUPABASE_DB_URL pooler),
-- el cual BYPASSEA RLS, por lo que estas políticas no lo afectan. El objetivo es
-- proteger las tablas ante cualquier acceso por PostgREST (anon/authenticated).

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals  ENABLE ROW LEVEL SECURITY;

-- Políticas por propietario (para coherencia con auth.uid() si se expone PostgREST).
-- Como service_role bypassa RLS, estas no bloquean al backend.

DROP POLICY IF EXISTS "own_users" ON users;
CREATE POLICY "own_users" ON users
    FOR ALL
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "own_foods" ON foods;
CREATE POLICY "own_foods" ON foods
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "own_food_entries" ON food_entries;
CREATE POLICY "own_food_entries" ON food_entries
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "own_daily_goals" ON daily_goals;
CREATE POLICY "own_daily_goals" ON daily_goals
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Revocar acceso por PostgREST: la data solo se sirve por FastAPI (service_role).
-- No se revoca a service_role, que conserva pleno acceso.
REVOKE ALL ON users, foods, food_entries, daily_goals FROM anon, authenticated;
