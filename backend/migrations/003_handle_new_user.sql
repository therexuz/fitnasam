-- 003_handle_new_user.sql — Crea automáticamente la fila en public.users
-- cuando se registra un usuario en Supabase Auth (auth.users).

-- Ajusta la FK de foods/food_entries/daily_goals para referenciar auth.users,
-- o mantén public.users con id = auth.users.id (UUID). Aquí sincronizamos el UUID.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
