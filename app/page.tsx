import Link from "next/link";

const mainTools = [
  {
    href: "/orders",
    label: "Préparer les commandes",
    description: "Retrouvez les commandes à expédier, y compris les précommandes en lot.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5h8M8 9h8M8 13h5m-8 8V3h14v18H5z" />
      </svg>
    ),
    className: "home-tool-orders",
    action: "Ouvrir les commandes",
  },
  {
    href: "/stock",
    label: "Mettre à jour le stock",
    description: "Comparez un fichier fournisseur avec Oxatis, puis appliquez les quantités.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5h16v12H4zM8 7.5V5h8v2.5m-4 4v5m0-5 2 2m-2-2-2 2" />
      </svg>
    ),
    className: "home-tool-stock",
    action: "Gérer le stock",
  },
  {
    href: "/articles",
    label: "Gérer le catalogue",
    description: "Recherchez et modifiez les articles, catégories et disponibilités.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 0v5h5M9 13h6m-6 4h6" />
      </svg>
    ),
    className: "home-tool-catalogue",
    action: "Voir les articles",
  },
];

const otherTools = [
  {
    href: "/matrice",
    label: "Importer la matrice",
    description: "Créer ou mettre à jour plusieurs fiches depuis le fichier Excel Matrice Oxatis.",
    icon: "↥",
  },
  {
    href: "/create",
    label: "Créer un article",
    description: "Ajouter une nouvelle fiche produit au catalogue.",
    icon: "+",
  },
  {
    href: "/analytics",
    label: "Analyser les données",
    description: "Consulter les indicateurs du catalogue et les ventes.",
    icon: "⌁",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-welcome" aria-labelledby="home-title">
        <div className="home-welcome-copy">
          <p className="home-eyebrow">ESPACE DE GESTION · OXATIS</p>
          <h1 id="home-title">Bonjour, que souhaitez-vous faire&nbsp;?</h1>
          <p>Les opérations courantes sont ici. Choisissez une action pour commencer.</p>
        </div>
        <div className="home-welcome-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
        </div>
      </section>

      <div className="home-content">
        <section aria-labelledby="home-daily-title">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">AU QUOTIDIEN</p>
              <h2 id="home-daily-title">Accès rapide</h2>
            </div>
            <span>3 outils principaux</span>
          </div>

          <div className="home-primary-grid">
            {mainTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className={`home-tool-card ${tool.className}`}>
                <span className="home-tool-icon">{tool.icon}</span>
                <span className="home-tool-label">{tool.label}</span>
                <span className="home-tool-description">{tool.description}</span>
                <span className="home-tool-action">{tool.action}<span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-secondary-section" aria-labelledby="home-other-title">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">AUTRES OUTILS</p>
              <h2 id="home-other-title">Pour les opérations ponctuelles</h2>
            </div>
          </div>
          <div className="home-secondary-grid">
            {otherTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="home-secondary-card">
                <span className="home-secondary-icon" aria-hidden="true">{tool.icon}</span>
                <span className="home-secondary-copy">
                  <span className="home-secondary-label">{tool.label}</span>
                  <span className="home-secondary-description">{tool.description}</span>
                </span>
                <span className="home-secondary-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="home-note">
          <span className="home-note-icon" aria-hidden="true">i</span>
          <p><strong>Connexion Oxatis</strong><span>Les identifiants API sont gérés dans une session sécurisée. Si une page signale une connexion manquante, configurez-la dans Stock Manager.</span></p>
          <Link href="/stock">Ouvrir Stock Manager <span aria-hidden="true">→</span></Link>
        </aside>

        <footer className="home-footer">Elephant Films <span>·</span> Outils internes de gestion</footer>
      </div>
    </div>
  );
}
