import type { SVGProps } from "react";
import type { Tab } from "../types";

const items: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "registro", label: "Registrar" },
  { id: "escaneo", label: "Escanear" },
  { id: "alimento", label: "Alimento" },
  { id: "perfil", label: "Perfil" },
];

const common: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Icon({ id }: { id: Tab }) {
  switch (id) {
    case "resumen":
      return (
        <svg {...common}>
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M7 13v4" />
          <path d="M12 9v8" />
          <path d="M17 5v12" />
        </svg>
      );
    case "registro":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
    case "escaneo":
      return (
        <svg {...common}>
          <path d="M3 8V6a3 3 0 0 1 3-3h2" />
          <path d="M16 3h2a3 3 0 0 1 3 3v2" />
          <path d="M21 16v2a3 3 0 0 1-3 3h-2" />
          <path d="M8 21H6a3 3 0 0 1-3-3v-2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "perfil":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      );
    case "alimento":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomNav({
  current,
  onChange,
}: {
  current: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <button
          key={it.id}
          className={`nav-item${current === it.id ? " active" : ""}`}
          onClick={() => onChange(it.id)}
          aria-label={it.label}
        >
          <Icon id={it.id} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
