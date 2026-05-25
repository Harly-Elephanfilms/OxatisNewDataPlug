// app/analytics/components/SalesDatePicker.tsx
"use client";
import { useState } from "react";

interface Props {
  onAnalyze: (from: string, to: string) => void;
  disabled?: boolean;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function presetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: formatDate(from), to: formatDate(to) };
}

const PRESETS = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "3 mois", days: 90 },
];

export function SalesDatePicker({ onAnalyze, disabled }: Props) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedDays, setSelectedDays] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(formatDate(new Date()));

  const handleAnalyze = () => {
    if (mode === "preset") {
      const { from, to } = presetRange(selectedDays);
      onAnalyze(from, to);
    } else {
      if (!customFrom || !customTo) return;
      onAnalyze(customFrom, customTo);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => { setMode("preset"); setSelectedDays(p.days); }}
            className={`btn btn-sm ${mode === "preset" && selectedDays === p.days ? "btn-primary" : "btn-secondary"}`}
            disabled={disabled}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setMode("custom")}
          className={`btn btn-sm ${mode === "custom" ? "btn-primary" : "btn-secondary"}`}
          disabled={disabled}
        >
          Personnalisé
        </button>
      </div>

      {mode === "custom" && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="form-input"
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.625rem" }}
            disabled={disabled}
          />
          <span style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="form-input"
            style={{ fontSize: "0.8125rem", padding: "0.35rem 0.625rem" }}
            disabled={disabled}
          />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        className="btn btn-primary btn-sm"
        disabled={disabled || (mode === "custom" && (!customFrom || !customTo))}
      >
        Analyser
      </button>
    </div>
  );
}
