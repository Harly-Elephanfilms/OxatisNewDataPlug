"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCredentials } from "@/app/contexts/CredentialsContext";
import ProductForm from "@/app/components/features/create/ProductForm";
import CsvImportMode from "@/app/components/features/create/CsvImportMode";

type Tab = "form" | "csv";

export default function CreateArticlePage() {
  const { appId, token, hasCredentials } = useCredentials();
  const [tab, setTab] = useState<Tab>("form");
  const [serverHasCredentials, setServerHasCredentials] = useState(false);

  useEffect(() => {
    fetch("/api/oxatis/config")
      .then((r) => r.json())
      .then((d) => setServerHasCredentials(d.hasCredentials))
      .catch(() => {});
  }, []);

  const noCredentials = !serverHasCredentials && !hasCredentials;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Création d&apos;articles</h1>
            <p className="section-subtitle mt-1">Ajouter des produits au catalogue Elephant Films</p>
          </div>
          <Link href="/articles" className="btn btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Voir les articles
          </Link>
        </div>

        {/* Credentials warning */}
        {noCredentials && (
          <div className="alert alert-warning mt-4">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>
              Identifiants API manquants — configurez-les dans le{" "}
              <Link href="/stock" className="underline font-semibold">Stock Manager</Link>.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-slate-200 -mb-[1.5rem]">
          {(["form", "csv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {t === "form" ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Formulaire
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Import CSV
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-4xl mx-auto">
          {tab === "form" && (
            <ProductForm
              appId={appId}
              token={token}
              serverHasCredentials={serverHasCredentials}
              noCredentials={noCredentials}
              onSuccess={() => {}}
              onError={() => {}}
            />
          )}

          {tab === "csv" && (
            <CsvImportMode
              appId={appId}
              token={token}
              serverHasCredentials={serverHasCredentials}
              noCredentials={noCredentials}
            />
          )}
        </div>
      </div>
    </>
  );
}
