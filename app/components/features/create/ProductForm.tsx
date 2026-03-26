"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { CategoryNode } from "@/lib/types";
import type { CategoryAssignment } from "@/lib/oxatis-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFormData {
  itemSKU: string;
  name: string;
  priceHT: string;
  tva: string;
  stock: string;
  description: string;
  brand: string;
  ean: string;
  weight: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TVA_OPTIONS = [
  { label: "0 %", value: "0" },
  { label: "2,1 %", value: "2.1" },
  { label: "5,5 %", value: "5.5" },
  { label: "10 %", value: "10" },
  { label: "20 %", value: "20" },
];

const INITIAL_FORM: ProductFormData = {
  itemSKU: "",
  name: "",
  priceHT: "",
  tva: "20",
  stock: "0",
  description: "",
  brand: "",
  ean: "",
  weight: "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  appId: string;
  token: string;
  serverHasCredentials: boolean;
  noCredentials: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
  n,
  label,
  icon,
}: {
  n: number;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {n}
      </span>
      {icon && <span className="text-slate-400">{icon}</span>}
      <h2 className="section-title text-base">{label}</h2>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductForm({
  appId,
  token,
  serverHasCredentials,
  noCredentials,
  onSuccess,
  onError,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [articleCategories, setArticleCategories] = useState<CategoryAssignment[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const priceTTC = useMemo(() => {
    const ht = parseFloat(form.priceHT.replace(",", "."));
    const tva = parseFloat(form.tva);
    if (isNaN(ht) || ht < 0 || !form.priceHT.trim()) return "";
    return (ht * (1 + tva / 100)).toFixed(2);
  }, [form.priceHT, form.tva]);

  const setField = useCallback(
    (key: keyof ProductFormData) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    []
  );

  const fetchCategoryTree = async () => {
    if (noCredentials) return;
    setLoadingTree(true);
    try {
      const params = serverHasCredentials
        ? ""
        : `?appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}`;
      const res = await fetch(`/api/oxatis/categories${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCategoryTree(data.tree);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur chargement catégories");
    } finally {
      setLoadingTree(false);
    }
  };

  const toggleCategory = (node: CategoryNode) => {
    const exists = articleCategories.some((c) => c.oxId === node.oxId);
    if (exists) {
      setArticleCategories((prev) => prev.filter((c) => c.oxId !== node.oxId));
    } else {
      if (articleCategories.length >= 10) {
        setFormError("Maximum 10 catégories par article");
        return;
      }
      const usedSlots = new Set(articleCategories.map((c) => c.slot));
      let nextSlot = 1;
      while (usedSlots.has(nextSlot)) nextSlot++;
      setArticleCategories((prev) => [
        ...prev,
        { oxId: node.oxId, name: node.name, parentOxId: node.parentOxId, slot: nextSlot },
      ]);
    }
  };

  const toggleExpanded = (oxId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(oxId)) next.delete(oxId);
      else next.add(oxId);
      return next;
    });
  };

  const validateForm = (): string | null => {
    if (!form.itemSKU.trim()) return "La référence (SKU) est obligatoire";
    if (!form.name.trim()) return "Le titre est obligatoire";
    if (!form.priceHT.trim()) return "Le prix HT est obligatoire";
    const price = parseFloat(form.priceHT.replace(",", "."));
    if (isNaN(price) || price < 0) return "Le prix HT doit être un nombre positif";
    if (form.ean && !/^\d{8,14}$/.test(form.ean.trim()))
      return "L'EAN doit contenir entre 8 et 14 chiffres";
    return null;
  };

  const handleFormSubmit = async () => {
    setFormError("");
    setFormSuccess("");
    setConfirmSubmit(false);
    setSaving(true);
    try {
      const res = await fetch("/api/oxatis/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(serverHasCredentials ? {} : { appId, token }),
          product: {
            itemSKU: form.itemSKU.trim(),
            name: form.name.trim(),
            priceHT: parseFloat(form.priceHT.replace(",", ".")),
            tva: parseFloat(form.tva),
            stock: parseInt(form.stock) || 0,
            description: form.description.trim() || undefined,
            brand: form.brand.trim() || undefined,
            ean: form.ean.trim() || undefined,
            weight: parseFloat(form.weight.replace(",", ".")) || undefined,
            categories: articleCategories,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur création");

      const catWarning =
        data.categoriesResult?.error
          ? ` (⚠ catégories : ${data.categoriesResult.error})`
          : "";
      const oxIdInfo = data.oxatisId ? ` — OxID : ${data.oxatisId}` : "";
      const msg = `Article "${form.name.trim()}" créé avec succès !${oxIdInfo}${catWarning}`;
      setFormSuccess(msg);
      onSuccess(msg);
      setForm(INITIAL_FORM);
      setArticleCategories([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setFormError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryTree = (nodes: CategoryNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      const isAssigned = articleCategories.some((c) => c.oxId === node.oxId);
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedNodes.has(node.oxId);
      return (
        <div key={node.oxId}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
              isAssigned ? "bg-indigo-50" : "hover:bg-slate-50"
            }`}
            style={{ paddingLeft: `${depth * 18 + 8}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(node.oxId)}
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            <button
              onClick={() => toggleCategory(node)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isAssigned
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-300 hover:border-indigo-400"
              }`}
            >
              {isAssigned && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`text-sm select-none ${
                isAssigned ? "font-semibold text-indigo-700" : "text-slate-700 hover:text-slate-900"
              }`}
              onClick={() => toggleCategory(node)}
            >
              {node.name}
            </span>
          </div>
          {hasChildren && isExpanded && renderCategoryTree(node.children, depth + 1)}
        </div>
      );
    });

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {formError && (
        <div className="alert alert-error">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="flex-1 whitespace-pre-wrap">{formError}</span>
          <button onClick={() => setFormError("")} className="text-current opacity-60 hover:opacity-100 font-bold text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}
      {formSuccess && (
        <div className="alert alert-success">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{formSuccess}</span>
          <button onClick={() => setFormSuccess("")} className="text-current opacity-60 hover:opacity-100 font-bold text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}

      {/* 1. Informations générales */}
      <div className="card p-6">
        <SectionTitle n={1} label="Informations générales" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        } />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label">
              Référence (SKU) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.itemSKU}
              onChange={setField("itemSKU")}
              placeholder="REF-001"
              className="input font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">Identifiant unique — sans espaces</p>
          </div>
          <div>
            <label className="label">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              placeholder="Nom du produit"
              className="input"
            />
          </div>
          <div>
            <label className="label">Marque</label>
            <input
              type="text"
              value={form.brand}
              onChange={setField("brand")}
              placeholder="Marque / éditeur"
              className="input"
            />
          </div>
          <div>
            <label className="label">EAN / Code-barres</label>
            <input
              type="text"
              value={form.ean}
              onChange={setField("ean")}
              placeholder="1234567890123"
              className="input font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">EAN-8, EAN-13 ou UPC (optionnel)</p>
          </div>
        </div>
      </div>

      {/* 2. Prix & Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Prix */}
        <div className="card p-6">
          <SectionTitle n={2} label="Prix" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <div className="space-y-4 mt-5">
            <div>
              <label className="label">
                Prix HT <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.priceHT}
                  onChange={setField("priceHT")}
                  placeholder="9.99"
                  className="input font-mono pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
              </div>
            </div>
            <div>
              <label className="label">Taux de TVA</label>
              <select
                value={form.tva}
                onChange={setField("tva")}
                className="input"
              >
                {TVA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {priceTTC && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-sm font-medium text-indigo-700">Prix TTC calculé</span>
                <span className="text-sm font-bold text-indigo-800 font-mono">{priceTTC} €</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="card p-6">
          <SectionTitle n={3} label="Stock initial" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          } />
          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Quantité en stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={setField("stock")}
                min="0"
                className="input"
              />
            </div>
            <div>
              <label className="label">Poids (kg)</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.weight}
                  onChange={setField("weight")}
                  placeholder="0.150"
                  className="input font-mono pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Catégories */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <SectionTitle n={4} label={`Catégories (${articleCategories.length}/10)`} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          } />
          {articleCategories.length > 0 && (
            <button
              onClick={() => setArticleCategories([])}
              className="btn btn-danger btn-sm"
            >
              Tout vider
            </button>
          )}
        </div>
        <div className="p-6">
          {noCredentials ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Identifiants API requis pour gérer les catégories.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Assigned */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Catégories assignées
                </p>
                {articleCategories.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Aucune catégorie sélectionnée</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...articleCategories]
                      .sort((a, b) => a.slot - b.slot)
                      .map((cat) => {
                        const usedSlots = new Set(articleCategories.map((c) => c.slot));
                        return (
                          <div
                            key={cat.oxId}
                            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2"
                          >
                            <select
                              value={cat.slot}
                              onChange={(e) => {
                                const newSlot = parseInt(e.target.value);
                                setArticleCategories(
                                  articleCategories.map((c) => {
                                    if (c.oxId === cat.oxId) return { ...c, slot: newSlot };
                                    if (c.slot === newSlot) return { ...c, slot: cat.slot };
                                    return c;
                                  })
                                );
                              }}
                              className="text-indigo-600 text-xs font-semibold bg-white border border-indigo-200 rounded-md px-1.5 py-1 w-28 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  Catégorie {n}
                                  {usedSlots.has(n) && n !== cat.slot ? " ↔" : ""}
                                </option>
                              ))}
                            </select>
                            <span className="text-indigo-700 font-medium text-sm flex-1 truncate">{cat.name}</span>
                            <button
                              onClick={() =>
                                setArticleCategories(
                                  articleCategories.filter((c) => c.oxId !== cat.oxId)
                                )
                              }
                              className="text-indigo-300 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Tree picker */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Arbre des catégories
                </p>
                {loadingTree ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                    <span className="spinner spinner-sm" />
                    Chargement...
                  </div>
                ) : categoryTree.length === 0 ? (
                  <button
                    onClick={fetchCategoryTree}
                    className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium py-4 border-2 border-dashed border-indigo-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                  >
                    <svg className="w-5 h-5 mx-auto mb-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                    Charger l&apos;arbre des catégories
                  </button>
                ) : (
                  <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-white p-1">
                    {renderCategoryTree(categoryTree)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Images */}
      <div className="card p-6">
        <SectionTitle n={5} label="Images" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        } />
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-800">
            Les images doivent être uploadées dans la <strong>galerie Oxatis</strong> puis associées au produit depuis le back-office. L&apos;API de création ne supporte pas l&apos;assignation d&apos;images par URL.
          </p>
        </div>
      </div>

      {/* 6. Description */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionTitle n={6} label="Description" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          } />
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {form.description.length} car.
          </span>
        </div>
        <textarea
          value={form.description}
          onChange={setField("description")}
          rows={5}
          placeholder="Description détaillée du produit..."
          className="input resize-y w-full"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-4 pt-2">
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setArticleCategories([]);
            setFormError("");
            setFormSuccess("");
          }}
          className="btn btn-danger"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Réinitialiser
        </button>

        {confirmSubmit ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm text-amber-700 font-medium">
              Confirmer la création de &laquo;&nbsp;{form.name.trim()}&nbsp;&raquo; ?
            </span>
            <button
              onClick={handleFormSubmit}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? (
                <>
                  <span className="spinner spinner-sm" />
                  Création...
                </>
              ) : (
                "Confirmer"
              )}
            </button>
            <button
              onClick={() => setConfirmSubmit(false)}
              disabled={saving}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const err = validateForm();
              if (err) {
                setFormError(err);
                return;
              }
              setConfirmSubmit(true);
            }}
            disabled={saving || noCredentials}
            className="btn btn-primary btn-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Créer l&apos;article
          </button>
        )}
      </div>
    </div>
  );
}
