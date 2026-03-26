import Link from "next/link";

interface Tool {
  id: string;
  href: string;
  label: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  badge: string;
  badgeClass: string;
  available: boolean;
}

const tools: Tool[] = [
  {
    id: "stock",
    href: "/stock",
    label: "Stock Manager",
    description: "Comparaison et mise à jour des stocks",
    detail: "Importez un CSV Oxatis ou fournisseur, comparez les quantités et mettez à jour en masse via l'API.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    accentColor: "#6366f1",
    accentBg: "#eef2ff",
    badge: "Disponible",
    badgeClass: "badge badge-indigo",
    available: true,
  },
  {
    id: "articles",
    href: "/articles",
    label: "Gestion des articles",
    description: "Modifier et organiser le catalogue produits",
    detail: "Consultez, filtrez et modifiez les articles. Gérez les catégories et effectuez des actions en masse.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    accentColor: "#7c3aed",
    accentBg: "#faf5ff",
    badge: "Disponible",
    badgeClass: "badge badge-purple",
    available: true,
  },
  {
    id: "create",
    href: "/create",
    label: "Créer un article",
    description: "Ajouter de nouveaux produits au catalogue",
    detail: "Formulaire complet de création d'article avec gestion des catégories, prix, stock et métadonnées.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accentColor: "#16a34a",
    accentBg: "#f0fdf4",
    badge: "Disponible",
    badgeClass: "badge badge-green",
    available: true,
  },
  {
    id: "matrice",
    href: "/matrice",
    label: "Import Matrice",
    description: "Importer le fichier Excel Matrice Oxatis",
    detail: "Glissez-déposez le fichier MatriceOxatis.xlsx pour créer de nouveaux articles ou mettre à jour les descriptions et dates de disponibilité.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    accentColor: "#0891b2",
    accentBg: "#ecfeff",
    badge: "Disponible",
    badgeClass: "badge badge-indigo",
    available: true,
  },
  {
    id: "analytics",
    href: "/analytics",
    label: "Data Analyse",
    description: "Statistiques et performances du site",
    detail: "Tableaux de bord et métriques de performance. Visualisez les ventes, le trafic et les tendances.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    accentColor: "#d97706",
    accentBg: "#fffbeb",
    badge: "Disponible",
    badgeClass: "badge badge-amber",
    available: true,
  },
];

const quickLinks = [
  { label: "Mettre à jour le stock", href: "/stock", icon: "↑" },
  { label: "Voir les articles", href: "/articles", icon: "→" },
  { label: "Import Matrice", href: "/matrice", icon: "↓" },
  { label: "Statistiques", href: "/analytics", icon: "↗" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Hero banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          padding: "2.5rem 2rem 3rem",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <svg
                style={{ width: 26, height: 26, color: "#a5b4fc" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Elephant Films
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#a5b4fc", margin: "0.2rem 0 0" }}>
                Outils de gestion Oxatis
              </p>
            </div>
          </div>

          <p
            style={{
              fontSize: "1rem",
              color: "#c7d2fe",
              maxWidth: 480,
              lineHeight: 1.6,
              marginBottom: "1.75rem",
            }}
          >
            Gérez votre catalogue, vos stocks et vos articles depuis une interface centralisée.
          </p>

          {/* Quick links */}
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            {quickLinks.map((ql) => (
              <Link
                key={ql.href}
                href={ql.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.4rem 0.875rem",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#e0e7ff",
                  textDecoration: "none",
                  backdropFilter: "blur(4px)",
                  transition: "background 0.15s ease",
                }}
              >
                <span style={{ fontWeight: 700, color: "#a5b4fc" }}>{ql.icon}</span>
                {ql.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        {/* Tools section */}
        <div style={{ marginBottom: "0.75rem" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: "1rem",
            }}
          >
            Outils disponibles
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {tools.map((tool) => {
              const cardInner = (
                <div
                  className={`card${tool.available ? " card-hover" : ""}`}
                  style={{
                    padding: "1.375rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    opacity: tool.available ? 1 : 0.6,
                    cursor: tool.available ? "pointer" : "default",
                    height: "100%",
                  }}
                >
                  {/* Icon + badge row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: tool.accentBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: tool.accentColor,
                        flexShrink: 0,
                      }}
                    >
                      {tool.icon}
                    </div>
                    <span className={tool.badgeClass}>{tool.badge}</span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--foreground)",
                        margin: "0 0 0.375rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {tool.label}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        margin: "0 0 0.5rem",
                        fontWeight: 500,
                      }}
                    >
                      {tool.description}
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {tool.detail}
                    </p>
                  </div>

                  {/* CTA */}
                  {tool.available && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: tool.accentColor,
                      }}
                    >
                      Ouvrir
                      <svg
                        style={{ width: 14, height: 14 }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </div>
              );

              return tool.available ? (
                <Link
                  key={tool.id}
                  href={tool.href}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  {cardInner}
                </Link>
              ) : (
                <div key={tool.id}>{cardInner}</div>
              );
            })}
          </div>
        </div>

        {/* Info bar */}
        <div
          className="card"
          style={{
            marginTop: "1.75rem",
            padding: "1rem 1.375rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              style={{ width: 16, height: 16, color: "#6366f1" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151", margin: 0 }}>
              Outil interne — elephantfilms.com
            </p>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.1rem 0 0" }}>
              Les credentials API Oxatis sont sauvegardés localement dans votre navigateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
