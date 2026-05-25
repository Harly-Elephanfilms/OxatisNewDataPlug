"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "intro",
    title: "Introduction",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
  {
    id: "config",
    title: "Configuration des identifiants",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "stock",
    title: "Gestion du stock",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    id: "articles",
    title: "Articles",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "creer",
    title: "Créer un article",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "matrice",
    title: "Import Matrice",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
      title="Haut de page"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}

export default function AidePage() {
  const [activeSection, setActiveSection] = useState("intro");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Aide</h1>
            <p className="section-subtitle mt-1">Guide d&apos;utilisation des outils Elephant Films Oxatis</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-6xl mx-auto flex gap-8">
          {/* Sticky sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="sticky top-20 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                Sommaire
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className={activeSection === s.id ? "text-indigo-500" : "text-slate-400"}>
                    {s.icon}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-10 pb-16">

            {/* ── Introduction ── */}
            <section id="intro" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[0].icon}</span>
                  Introduction
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  L&apos;application <strong>Elephant Films Outils Oxatis</strong> permet de gérer le catalogue produits,
                  le stock et les articles sur <a href="https://elephantfilms.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">elephantfilms.com</a> via l&apos;API Oxatis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {[
                    { href: "/stock", label: "Gestion du stock", desc: "Comparer et mettre à jour les stocks" },
                    { href: "/articles", label: "Articles", desc: "Consulter, modifier et gérer les produits" },
                    { href: "/create", label: "Créer un article", desc: "Formulaire et import CSV" },
                    { href: "/matrice", label: "Import Matrice", desc: "Importer depuis MatriceOxatis.xlsx" },
                    { href: "/analytics", label: "Analytics", desc: "Vue d&apos;ensemble du catalogue" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700">{link.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Prérequis :</strong> Identifiants API Oxatis (AppID et Token) — voir la section{" "}
                    <a href="#config" onClick={(e) => { e.preventDefault(); document.getElementById("config")?.scrollIntoView({ behavior: "smooth" }); }} className="underline font-semibold">
                      Configuration
                    </a>.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Configuration ── */}
            <section id="config" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[1].icon}</span>
                  Configuration des identifiants
                </h2>
                <p className="text-slate-600 leading-relaxed mb-5">
                  Les identifiants sont sauvegardés automatiquement dans votre navigateur (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">localStorage</code>) dès leur saisie.
                  Ils persistent entre les sessions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="badge badge-blue flex-shrink-0 mt-0.5">AppID</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Identifiant de l&apos;application Oxatis</p>
                      <p className="text-sm text-slate-500 mt-1">Exemple : <code className="font-mono bg-slate-100 px-1 rounded">12345</code></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="badge badge-purple flex-shrink-0 mt-0.5">Token</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Jeton d&apos;authentification</p>
                      <p className="text-sm text-slate-500 mt-1">Fourni par Oxatis dans les paramètres de votre espace.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Note :</strong> Si les identifiants sont configurés côté serveur (variables d&apos;environnement),
                    ils ne sont pas nécessaires dans l&apos;interface — un indicateur vert s&apos;affiche dans ce cas.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Gestion du stock ── */}
            <section id="stock" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[2].icon}</span>
                  Gestion du stock
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  <Link href="/stock" className="hover:text-indigo-600 transition-colors">/stock</Link>
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Import de fichiers CSV</h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Deux formats supportés : <strong>format Oxatis</strong> (<code className="font-mono bg-slate-100 px-1 rounded text-xs">OxatisId;ItemSKU;Name;QtyInStock;...</code>) et <strong>format export fournisseur</strong> (<code className="font-mono bg-slate-100 px-1 rounded text-xs">Réf.;EAN;Titre;Type;...</code>)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Le système détecte automatiquement le format (séparateur, en-têtes)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Le stock actuel peut aussi être chargé directement depuis le site via le bouton <strong>Charger depuis le site</strong>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Marge de sécurité</h3>
                    <p className="text-sm text-slate-600">
                      Le nouveau stock est ajusté automatiquement : <strong>−5 unités</strong> sur chaque valeur.
                      Les stocks entre −4 et 0 deviennent <strong>1</strong>. Les stocks à −5 ou moins deviennent <strong>0</strong>.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Statuts des articles</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { badge: "badge-slate", label: "Inchangé", desc: "Stock identique" },
                        { badge: "badge-green", label: "Augmenté", desc: "Stock en hausse" },
                        { badge: "badge-red", label: "Diminué", desc: "Stock en baisse" },
                        { badge: "badge-indigo", label: "Nouveau", desc: "Absent du site" },
                        { badge: "badge-amber", label: "Manquant", desc: "Absent du CSV" },
                        { badge: "badge-purple", label: "Précommande", desc: "Date de sortie future" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <span className={`badge ${s.badge} flex-shrink-0`}>{s.label}</span>
                          <span className="text-xs text-slate-500">{s.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Mise à jour en masse</h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Dans l&apos;onglet <strong>Comparaison</strong>, cliquez sur <strong>Mettre à jour X produit(s)</strong>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Une modale de prévisualisation liste les modifications avant envoi
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Tri par colonne et filtre par statut disponibles dans la vue comparaison
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Articles ── */}
            <section id="articles" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[3].icon}</span>
                  Articles
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  <Link href="/articles" className="hover:text-indigo-600 transition-colors">/articles</Link>
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Chargement et recherche</h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Chargement de la liste complète depuis Oxatis (peut prendre quelques secondes)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Recherche par nom ou référence — filtre en temps réel
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Filtres disponibles : disponibilité, visibilité, catégorie, marque
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Édition individuelle</h3>
                    <p className="text-sm text-slate-600 mb-2">Cliquez sur un article pour ouvrir la modale d&apos;édition :</p>
                    <div className="space-y-2">
                      {[
                        { tab: "Infos", desc: "Description longue, date de disponibilité, visibilité, comportement hors stock" },
                        { tab: "Catégories", desc: "Assigner jusqu'à 10 catégories via l'arbre hiérarchique" },
                        { tab: "SEO", desc: "Titre et description méta" },
                      ].map((t) => (
                        <div key={t.tab} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="badge badge-blue flex-shrink-0 mt-0.5">{t.tab}</span>
                          <p className="text-sm text-slate-600">{t.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Opérations en masse</h3>
                    <p className="text-sm text-slate-600 mb-2">Sélectionnez plusieurs articles pour accéder aux actions groupées :</p>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Ajouter une catégorie (choisir le slot 1–10)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Effacer toutes les catégories
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Modifier la visibilité
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Modifier la date de disponibilité
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Supprimer des articles
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                    <p className="text-sm text-indigo-800">
                      <strong>Copier/coller les catégories :</strong> Utilisez le bouton <strong>Copier</strong> dans la modale d&apos;un article pour copier ses catégories,
                      puis <strong>Coller</strong> dans la modale d&apos;un autre article.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Créer un article ── */}
            <section id="creer" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[4].icon}</span>
                  Créer un article
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  <Link href="/create" className="hover:text-indigo-600 transition-colors">/create</Link>
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <span className="badge badge-blue">Mode Formulaire</span>
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Champs <strong>obligatoires</strong> : Référence (SKU) et Nom
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        TVA disponible : 0 %, 2,1 %, 5,5 %, 10 %, 20 %
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Après création : option d&apos;assigner une ou plusieurs catégories
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Le prix TTC est calculé automatiquement
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <span className="badge badge-green">Mode Import CSV</span>
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Téléchargez le modèle CSV via le bouton <strong>Télécharger le template CSV</strong>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Colonnes détectées automatiquement (insensible à la casse et aux accents)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Aperçu des lignes avant envoi, avec indicateur d&apos;erreurs
                      </li>
                    </ul>
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Colonnes reconnues</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          ["ref / sku / reference", "Référence"],
                          ["titre / name / nom", "Titre"],
                          ["prix / prix_ht / price", "Prix HT"],
                          ["tva / vat", "TVA"],
                          ["ean / barcode", "Code-barres"],
                          ["marque / brand", "Marque"],
                          ["stock / qty / quantite", "Stock"],
                          ["description / desc", "Description"],
                        ].map(([col, label]) => (
                          <div key={col} className="flex items-center gap-1.5">
                            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{col}</code>
                            <span className="text-xs text-slate-400">→ {label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Import Matrice ── */}
            <section id="matrice" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[5].icon}</span>
                  Import Matrice
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  <Link href="/matrice" className="hover:text-indigo-600 transition-colors">/matrice</Link>
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Fichier source</h3>
                    <p className="text-sm text-slate-600">
                      Importez le fichier <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-xs">MatriceOxatis.xlsx</code> par glisser-déposer ou sélection.
                      Le système lit la feuille <strong>Articles</strong> du classeur.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Détection automatique</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-sm font-semibold text-blue-700 mb-1">Nouveau article</p>
                        <p className="text-xs text-blue-600">L&apos;OxatisId est vide ou nul dans la feuille Articles</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-sm font-semibold text-green-700 mb-1">Article existant</p>
                        <p className="text-xs text-green-600">L&apos;OxatisId est rempli dans la feuille Articles</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Fonctionnalités clés</h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Filtres : Tous / Nouveaux seulement / Existants seulement
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Avant création : vérification préalable sur Oxatis pour éviter les doublons
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Si un article existe déjà : modale de comparaison (Matrice vs Oxatis côte à côte)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Catégorie par défaut sélectionnable — sauvegardée pour la prochaine session
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Pour les existants : mise à jour du Nom, Prix, Description, Date de disponibilité
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Progression en temps réel avec compteur et liste d&apos;erreurs
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Analytics ── */}
            <section id="analytics" className="scroll-mt-20">
              <div className="card p-7">
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <span className="text-indigo-500">{sections[6].icon}</span>
                  Analytics
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  <Link href="/analytics" className="hover:text-indigo-600 transition-colors">/analytics</Link>
                </p>

                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Vue d&apos;ensemble du catalogue</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        "Total articles",
                        "En stock",
                        "Hors stock",
                        "Stock négatif",
                        "Masqués",
                        "Sans catégorie",
                      ].map((m) => (
                        <div key={m} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                          <p className="text-xs text-slate-600 font-medium">{m}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 mt-3">
                      Indicateurs financiers : <strong>prix moyen et médian</strong>, <strong>valeur totale du stock</strong>.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Analyse par marque</h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Nombre d&apos;articles par marque, avec tri alphabétique ou par quantité
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        Cliquez sur une marque pour afficher tous ses articles en détail
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      <BackToTop />
    </>
  );
}
