import { fmt } from "../utils";

export default function ProgressBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="macro">
      <div className="macro-head">
        <span className="macro-label">{label}</span>
        <span className="macro-value">
          {fmt(value)} / {fmt(target)} {unit}
        </span>
      </div>
      <div className="bar">
        <div
          className={`bar-fill fill-${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
