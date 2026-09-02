import { useEffect, useState } from "react";
import BottomNav from "./components/BottomNav";
import Resumen from "./screens/Resumen";
import Registro from "./screens/Registro";
import Escaneo from "./screens/Escaneo";
import Perfil from "./screens/Perfil";
import Auth from "./screens/Auth";
import { supabase } from "./supabase";
import { setAuthToken } from "./api";
import type { Tab } from "./types";

export default function App() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token ?? null;
      setAuthToken(token);
      setAuthenticated(Boolean(token));
      setSessionReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;
      setAuthToken(token);
      setAuthenticated(Boolean(token));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setTab("resumen");
  }

  if (!sessionReady) {
    return <p className="muted" style={{ padding: 24 }}>Cargando…</p>;
  }

  if (!authenticated) {
    return (
      <div className="app">
        <main className="main">
          <Auth onAuthenticated={() => setAuthenticated(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="main">
        {tab === "resumen" && <Resumen onNavigate={setTab} />}
        {tab === "registro" && <Registro onNavigate={setTab} />}
        {tab === "escaneo" && <Escaneo onNavigate={setTab} />}
        {tab === "perfil" && <Perfil onLogout={handleLogout} />}
      </main>
      <BottomNav current={tab} onChange={setTab} />
    </div>
  );
}
