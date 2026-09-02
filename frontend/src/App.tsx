import { useState } from "react";
import BottomNav from "./components/BottomNav";
import Resumen from "./screens/Resumen";
import Registro from "./screens/Registro";
import Escaneo from "./screens/Escaneo";
import Perfil from "./screens/Perfil";
import type { Tab } from "./types";

export default function App() {
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <div className="app">
      <main className="main">
        {tab === "resumen" && <Resumen onNavigate={setTab} />}
        {tab === "registro" && <Registro onNavigate={setTab} />}
        {tab === "escaneo" && <Escaneo onNavigate={setTab} />}
        {tab === "perfil" && <Perfil />}
      </main>
      <BottomNav current={tab} onChange={setTab} />
    </div>
  );
}
