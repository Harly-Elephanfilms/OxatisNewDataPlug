"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseGa4Csv, type Ga4TrafficReport } from "../utils/ga4Csv";

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function TrafficAnalytics() {
  const [report, setReport] = useState<Ga4TrafficReport | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const importFile = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const result = parseGa4Csv(await file.text());
      if (result.rows.length === 0) throw new Error("Le fichier ne contient aucune ligne de statistiques.");
      setReport(result);
      setFileName(file.name);
    } catch (cause) {
      setReport(null);
      setFileName("");
      setError(cause instanceof Error ? cause.message : "Impossible de lire ce fichier.");
    }
  };

  const exportReport = () => {
    if (!report) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { Indicateur: "Utilisateurs (somme des lignes)", Valeur: report.totals.users },
      { Indicateur: "Sessions", Valeur: report.totals.sessions },
      { Indicateur: "Vues", Valeur: report.totals.views },
      { Indicateur: "Événements clés / conversions", Valeur: report.totals.conversions },
    ]), "Résumé");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.byDay), "Par jour");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.bySource), "Sources");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.rows), "Données importées");
    XLSX.writeFile(workbook, "statistiques-trafic-ga4.xlsx");
  };

  return (
    <section>
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--foreground)" }}>Trafic du site avec GA4</h2>
            <p style={{ margin: "0.4rem 0 0", color: "#64748b", fontSize: "0.875rem" }}>
              Importe un rapport CSV Google Analytics contenant les utilisateurs, sessions ou vues.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {report && <button type="button" className="btn btn-secondary btn-sm" onClick={exportReport}>Télécharger Excel</button>}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => fileInput.current?.click()}>
              {report ? "Remplacer le rapport" : "Importer un CSV GA4"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(event) => { void importFile(event.target.files?.[0]); event.target.value = ""; }}
            />
          </div>
        </div>
        {fileName && <p style={{ margin: "0.75rem 0 0", color: "#64748b", fontSize: "0.8rem" }}>Rapport chargé : {fileName}</p>}
        {error && <div className="alert alert-error" role="alert" style={{ marginTop: "1rem" }}>{error}</div>}
        {!report && !error && (
          <p style={{ margin: "1rem 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
            Dans GA4, ouvre un rapport, choisis la période puis utilise l’option d’export CSV. Le fichier reste dans ton navigateur et n’est pas envoyé au serveur.
          </p>
        )}
      </div>

      {report && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              ["Utilisateurs*", report.totals.users],
              ["Sessions", report.totals.sessions],
              ["Vues", report.totals.views],
              ["Événements clés", report.totals.conversions],
            ].map(([label, value]) => (
              <div className="card" key={label} style={{ padding: "1.15rem" }}>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>{label}</p>
                <p style={{ margin: "0.4rem 0 0", color: "var(--foreground)", fontSize: "1.5rem", fontWeight: 800 }}>{formatNumber(Number(value))}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: "-0.5rem 0 1.25rem", color: "#94a3b8", fontSize: "0.75rem" }}>
            * Total des utilisateurs additionnés sur les lignes importées ; une même personne peut apparaître plusieurs fois selon le découpage du rapport.
          </p>

          {report.byDay.length > 0 && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
              <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>Sessions et utilisateurs par jour</p>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={report.byDay} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Bar dataKey="sessions" name="Sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" name="Utilisateurs" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {report.bySource.some((source) => source.sessions > 0) && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>Sessions et conversions par source</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead><tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {["Source", "Sessions", "Événements clés", "Événements clés / 100 sessions"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "0.65rem", color: "#64748b", fontSize: "0.75rem" }}>{heading}</th>)}
                  </tr></thead>
                  <tbody>{report.bySource.map((source) => <tr key={source.source} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.7rem", fontWeight: 600 }}>{source.source}</td>
                    <td style={{ padding: "0.7rem" }}>{formatNumber(source.sessions)}</td>
                    <td style={{ padding: "0.7rem" }}>{formatNumber(source.conversions)}</td>
                    <td style={{ padding: "0.7rem" }}>{source.sessions ? ((source.conversions / source.sessions) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
