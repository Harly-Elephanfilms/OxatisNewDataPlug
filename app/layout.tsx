import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { CredentialsProvider } from "./contexts/CredentialsContext";
import { CategoriesProvider } from "./contexts/CategoriesContext";

export const metadata: Metadata = {
  title: "Elephant Films — Outils Oxatis",
  description: "Outils de gestion Oxatis pour Elephant Films",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <CredentialsProvider>
          <CategoriesProvider>
            <Sidebar />
            <main className="app-main">{children}</main>
          </CategoriesProvider>
        </CredentialsProvider>
      </body>
    </html>
  );
}
