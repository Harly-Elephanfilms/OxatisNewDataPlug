"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import { buildOrderExportRows, filterPreparationOrders, parisDate } from "@/lib/order-export";
import type { PreparationMode, PreparationOrder, PreparationPage, ProgressStateOption } from "@/lib/order-export";

type LoadStatus = "idle" | "loading" | "done" | "error" | "cancelled";

export default function OrdersWorkspace({ today }: { today: string }) {
  const { hasCredentials } = useCredentials();
  const [mode, setMode] = useState<PreparationMode>("unbilled");
  const [from, setFrom] = useState("2024-12-01");
  const [to, setTo] = useState(today);
  const [states, setStates] = useState<ProgressStateOption[]>([]);
  const [stateId, setStateId] = useState("");
  const [includeShipped, setIncludeShipped] = useState(false);
  const [excludedShipped, setExcludedShipped] = useState<string[]>([]);
  const [statesError, setStatesError] = useState("");
  const [statesLoading, setStatesLoading] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [orders, setOrders] = useState<PreparationOrder[]>([]);
  const [errors, setErrors] = useState<PreparationPage["errors"]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ scanned: 0, total: 0, page: 0, pages: 0 });
  const [loadedDescription, setLoadedDescription] = useState("");
  const [references, setReferences] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [displayLimit, setDisplayLimit] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const [statesRetry, setStatesRetry] = useState(0);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!hasCredentials) return;
    const controller = new AbortController();
    async function loadStates() {
      setStatesLoading(true);
      setStatesError("");
      try {
        const response = await fetch("/api/oxatis/orders/progress-states", { signal: controller.signal });
        const data = await response.json() as { states?: ProgressStateOption[]; error?: string };
        if (!response.ok || !data.states) throw new Error(data.error || "Impossible de charger les états.");
        setStates(data.states);
      } catch (err) {
        if (!controller.signal.aborted) setStatesError(err instanceof Error ? err.message : "Erreur réseau.");
      } finally {
        if (!controller.signal.aborted) setStatesLoading(false);
      }
    }
    void loadStates();
    return () => controller.abort();
  }, [hasCredentials, statesRetry]);

  const defaultState = states.find((s) => s.code.toUpperCase() === "PRECOMMANDE");
  const effectiveStateId = stateId || defaultState?.id || "";
  const chosenState = states.find((s) => s.id === effectiveStateId);
  const loading = status === "loading";
  const visible = useMemo(() => filterPreparationOrders(orders, references, search), [orders, references, search]);
  // L'export est toujours l'intersection de la sélection et du filtre affiché.
  const toExport = useMemo(() => visible.filter((order) => selected.has(order.oxId)), [visible, selected]);
  const selectedLines = toExport.reduce((sum, order) => sum + order.items.length, 0);

  async function loadOrders() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    setOrders([]);
    setErrors([]);
    setExcludedShipped([]);
    setSelected(new Set());
    setError("");
    setExportMessage("");
    setDisplayLimit(100);
    setProgress({ scanned: 0, total: 0, page: 0, pages: 0 });
    setLoadedDescription(mode === "unbilled" ? "Payées, non facturées" : `Facturées · ${chosenState?.name ?? "État personnalisé"}`);
    const collected = new Map<string, PreparationOrder>();
    const failures: PreparationPage["errors"] = [];
    const excluded = new Set<string>();
    let scanned = 0;
    let page = 1;
    let pages = 1;
    try {
      do {
        const params = new URLSearchParams({ from, to, mode, stateId: effectiveStateId, page: String(page), includeShipped: String(mode === "preorders" && includeShipped) });
        const response = await fetch(`/api/oxatis/orders/preparation?${params}`, { signal: controller.signal });
        const data = await response.json() as PreparationPage & { error?: string };
        if (!response.ok) throw new Error(data.error || "Impossible de récupérer les commandes.");
        if (controller.signal.aborted) return;
        pages = data.totalPages;
        scanned += data.scanned;
        for (const order of data.orders) collected.set(order.oxId, order);
        failures.push(...data.errors);
        for (const id of data.excludedShipped ?? []) excluded.add(id);
        setExcludedShipped(Array.from(excluded));
        setOrders(Array.from(collected.values()));
        setErrors([...failures]);
        setProgress({ scanned, total: data.totalItems, page, pages });
        page++;
      } while (page <= pages);
      setSelected(new Set(collected.keys()));
      setStatus("done");
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
        setStatus("error");
      }
    }
  }

  function cancel() {
    requestRef.current?.abort();
    setStatus("cancelled");
  }

  async function download() {
    if (status !== "done" || !toExport.length) return;
    setExporting(true);
    setError("");
    try {
      const XLSX = await import("xlsx");
      const date = parisDate();
      const rows = buildOrderExportRows(toExport, date);
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
      XLSX.writeFile(workbook, `Oxatis_${date}.xlsx`);
      setExportMessage(`${toExport.length} commande(s) complète(s), ${rows.length} ligne(s) exportée(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le fichier Excel.");
    } finally {
      setExporting(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setExportMessage("");
  }

  return (
    <div>
      <div className="page-header">
        <h1>Commandes</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>Récupérer les commandes à préparer et les exporter en un seul fichier Excel.</p>
      </div>
      <div className="page-content" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {!hasCredentials && <div className="alert alert-warning"><span>Renseignez vos identifiants Oxatis dans <Link href="/stock" className="underline">Stock Manager → CONFIG API</Link> pour récupérer les commandes.</span></div>}

        <form className="card" style={{ padding: "1.25rem" }} onSubmit={(event) => { event.preventDefault(); void loadOrders(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="orders-mode">Commandes à récupérer</label>
              <select id="orders-mode" className="input" value={mode} onChange={(e) => setMode(e.target.value as PreparationMode)} disabled={loading}>
                <option value="unbilled">Payées, non facturées</option>
                <option value="preorders">Payées, facturées — état personnalisé</option>
              </select>
            </div>
            {mode === "preorders" && <div>
              <label className="label" htmlFor="orders-state">État d’avancement actuel</label>
              <select id="orders-state" className="input" value={effectiveStateId} onChange={(e) => setStateId(e.target.value)} disabled={loading || statesLoading} required>
                <option value="">{statesLoading ? "Chargement des états…" : "Choisir un état"}</option>
                {states.map((state) => <option key={state.id} value={state.id}>{state.name} ({state.code})</option>)}
              </select>
              <label className="flex items-start gap-2" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                <input type="checkbox" checked={includeShipped} onChange={(e) => setIncludeShipped(e.target.checked)} disabled={loading} />
                <span>Inclure les commandes marquées expédiées dans Oxatis</span>
              </label>
              {includeShipped && <p style={{ color: "var(--warning)", fontSize: "0.75rem", marginTop: "0.4rem" }}>Vérifiez ces commandes avant l’export pour éviter un second envoi.</p>}
              {statesError && <p className="alert alert-error" style={{ marginTop: "0.5rem" }}>{statesError} <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatesRetry((n) => n + 1)}>Réessayer</button></p>}
            </div>}
            <div>
              <label className="label" htmlFor="orders-from">Début de période</label>
              <input id="orders-from" className="input" type="date" min="2010-01-15" max={to} value={from} onChange={(e) => setFrom(e.target.value)} required disabled={loading} />
            </div>
            <div>
              <label className="label" htmlFor="orders-to">Fin de période</label>
              <input id="orders-to" className="input" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} required disabled={loading} />
            </div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.875rem" }}>La période porte sur la dernière modification des commandes dans Oxatis. Gardez une plage large pour retrouver les anciennes précommandes. Les commandes marquées expédiées sont exclues par défaut.</p>
          <div className="flex flex-wrap items-center gap-3" style={{ marginTop: "1rem" }}>
            <button className="btn btn-primary" type="submit" disabled={loading || !hasCredentials || (mode === "preorders" && !effectiveStateId)}>{loading ? "Récupération…" : "Récupérer les commandes"}</button>
            {loading && <button className="btn btn-secondary" type="button" onClick={cancel}>Annuler</button>}
          </div>
        </form>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {excludedShipped.length > 0 && <div className="alert alert-warning"><div>
          <p>{excludedShipped.length} commande(s) correspondent à votre recherche mais sont marquées expédiées dans Oxatis et exclues du lot.</p>
          <details style={{ marginTop: "0.5rem" }}><summary>Voir les numéros des commandes exclues</summary><p>{excludedShipped.join(", ")}</p></details>
          {mode === "preorders" && <p style={{ marginTop: "0.5rem" }}>Pour les récupérer aussi, cochez « Inclure les commandes marquées expédiées » puis relancez la récupération.</p>}
        </div></div>}
        {loading && <div className="card" style={{ padding: "1rem" }} role="status" aria-live="polite">
          <p>{progress.page ? `${progress.scanned} / ${progress.total} commandes examinées — page ${progress.page} / ${progress.pages}` : "Recherche des commandes…"}</p>
          <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>{orders.length} commande(s) à préparer récupérée(s). L’export sera disponible à la fin.</p>
          {progress.total > 0 && <progress className="w-full mt-3" max={progress.total} value={Math.min(progress.scanned, progress.total)} aria-label="Récupération des commandes" />}
        </div>}
        {(status === "cancelled" || (status === "error" && orders.length > 0)) && <div className="alert alert-warning">La récupération est incomplète. Relancez-la avant d’exporter le lot.</div>}
        {errors.length > 0 && <div className="alert alert-warning" role="alert">
          <p>{errors.length} commande(s) n’ont pas pu être récupérées et sont exclues de l’export.</p>
          <details style={{ marginTop: "0.5rem" }}><summary>Voir les commandes en erreur</summary><ul>{errors.map((failure) => <li key={failure.orderId}>Commande {failure.orderId} : {failure.message}</li>)}</ul></details>
        </div>}

        {(status === "done" || orders.length > 0) && <section className="card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{loadedDescription} — {orders.length} commande(s)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: "1rem" }}>
            <div>
              <label className="label" htmlFor="orders-skus">Références reçues en stock</label>
              <input id="orders-skus" className="input" placeholder="Ex. 655639, 655640" value={references} onChange={(e) => { setReferences(e.target.value); setDisplayLimit(100); setExportMessage(""); }} />
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.4rem" }}>Références exactes, séparées par une virgule ou un espace. Une commande contenant l’une des références est retenue, avec tous ses articles.</p>
            </div>
            <div>
              <label className="label" htmlFor="orders-search">Rechercher dans les commandes</label>
              <input id="orders-search" className="input" placeholder="Numéro, client, titre…" value={search} onChange={(e) => { setSearch(e.target.value); setDisplayLimit(100); setExportMessage(""); }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3" style={{ margin: "1rem 0" }}>
            <button type="button" className="btn btn-secondary btn-sm" disabled={status !== "done" || !visible.length} onClick={() => { setSelected(new Set(visible.map((o) => o.oxId))); setExportMessage(""); }}>Tout sélectionner dans le filtre ({visible.length})</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelected(new Set()); setExportMessage(""); }}>Tout désélectionner</button>
            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{toExport.length} sélectionnée(s) / {visible.length} dans le filtre</span>
          </div>
          {[
            { title: "Commandes à préparer", shipped: false, orders: visible.filter((o) => !o.shipped) },
            ...(orders.some((o) => o.shipped) ? [{ title: "Commandes marquées expédiées par Oxatis", shipped: true, orders: visible.filter((o) => o.shipped) }] : []),
          ].map((group) => <section key={group.title} aria-label={group.title} style={{ marginTop: "1.25rem", padding: "1rem", border: `1px solid ${group.shipped ? "var(--warning)" : "var(--border)"}`, borderRadius: "0.75rem" }}>
            <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{group.title} — {group.orders.length} commande(s)</h3>
            {group.shipped && <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>Ces commandes sont encore dans l’état recherché, mais Oxatis les marque expédiées. Vérifiez-les avant de les envoyer à nouveau.</p>}
            <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: "0.875rem" }}>
              <button type="button" className="btn btn-secondary btn-sm" disabled={status !== "done" || !group.orders.length} onClick={() => {
                setSelected((prev) => new Set([...prev, ...group.orders.map((o) => o.oxId)])); setExportMessage("");
              }}>Sélectionner ce groupe</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={status !== "done" || !group.orders.length} onClick={() => {
                setSelected((prev) => { const next = new Set(prev); for (const order of group.orders) next.delete(order.oxId); return next; }); setExportMessage("");
              }}>Désélectionner ce groupe</button>
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{group.orders.filter((o) => selected.has(o.oxId)).length} sélectionnée(s)</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Sélection</th><th>Commande</th><th>Date</th><th>Client / livraison</th><th>Articles de la commande complète</th><th>Montant</th></tr></thead>
                <tbody>
                  {group.orders.slice(0, displayLimit).map((order) => <tr key={order.oxId}>
                    <td><input type="checkbox" aria-label={`Exporter la commande ${order.oxId}`} checked={selected.has(order.oxId)} onChange={() => toggle(order.oxId)} disabled={status !== "done"} /></td>
                    <td style={{ whiteSpace: "nowrap" }}><strong>{order.oxId}</strong><p style={{ color: "var(--muted)", fontSize: "0.7rem" }}>{order.invoiceId ? `Facture ${order.invoiceId}` : "Non facturée"}</p></td>
                    <td style={{ whiteSpace: "nowrap" }}>{order.date.split("-").reverse().join("/")}</td>
                    <td><p>{order.customer}</p><p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{order.zipCode} {order.city} · {order.country}</p><details style={{ fontSize: "0.75rem", marginTop: "0.4rem" }}><summary>Coordonnées</summary><p>{order.address}</p><p>{order.email}</p><p>{order.phone}</p></details></td>
                    <td><ul style={{ listStyle: "none", padding: 0 }}>{order.items.map((item, index) => <li key={index} style={{ marginBottom: "0.35rem" }}><strong>{item.quantity} × {item.sku}</strong> — {item.name}{item.bundled && <span style={{ color: "var(--muted)" }}> (article de pack)</span>}</li>)}</ul></td>
                    <td style={{ whiteSpace: "nowrap" }}>{order.netAmount.toFixed(2)} €</td>
                  </tr>)}
                  {!group.orders.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>{orders.length ? "Aucune commande dans ce groupe pour le filtre actuel." : "Aucune commande à préparer pour cette période."}</td></tr>}
                </tbody>
              </table>
            </div>
            {group.orders.length > displayLimit && <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.75rem" }} onClick={() => setDisplayLimit((n) => n + 100)}>Afficher 100 commandes de plus ({displayLimit} / {group.orders.length})</button>}
          </section>)}
          <div className="flex flex-wrap items-center gap-4" style={{ marginTop: "1.25rem" }}>
            <button type="button" className="btn btn-primary" disabled={status !== "done" || exporting || !toExport.length} onClick={() => void download()}>{exporting ? "Création de l’Excel…" : `Exporter ${toExport.length} commande(s) complète(s)`}</button>
            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{selectedLines} ligne(s) · format identique au script · sans en-tête</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.875rem" }}>Seules les commandes sélectionnées dans le filtre actuel sont exportées. Vérifiez que tous leurs articles peuvent être expédiés ensemble. L’export ne change ni la facturation ni l’état d’avancement dans Oxatis.</p>
        </section>}
        {exportMessage && <div className="alert alert-success" role="status">{exportMessage}</div>}
      </div>
    </div>
  );
}
