"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CredentialsContextValue {
  appId: string;
  /** Always empty — token is stored in httpOnly cookie only */
  token: string;
  setCredentials: (appId: string, token: string) => Promise<{ success: boolean; error?: string }>;
  /** True if server has env vars or a valid session cookie */
  hasCredentials: boolean;
  /** True if server has env vars or a valid session cookie */
  serverHasCredentials: boolean;
  /** Always empty — server reads credentials from httpOnly cookie */
  credParams: Record<string, never>;
}

const CredentialsContext = createContext<CredentialsContextValue>({
  appId: "",
  token: "",
  setCredentials: async () => ({ success: false }),
  hasCredentials: false,
  serverHasCredentials: false,
  credParams: {},
});

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [appId, setAppId] = useState("");
  const [serverHasCredentials, setServerHasCredentials] = useState(false);

  useEffect(() => {
    const savedAppId = sessionStorage.getItem("oxatis_appId") ?? "";
    setAppId(savedAppId);

    fetch("/api/oxatis/config")
      .then((r) => r.json())
      .then((d: { hasCredentials?: boolean }) => setServerHasCredentials(!!d.hasCredentials))
      .catch(() => {});
  }, []);

  const setCredentials = async (
    newAppId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/oxatis/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: newAppId, token }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) return { success: false, error: data.error };

      setAppId(newAppId);
      sessionStorage.setItem("oxatis_appId", newAppId);
      setServerHasCredentials(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur réseau" };
    }
  };

  return (
    <CredentialsContext.Provider
      value={{
        appId,
        token: "",
        setCredentials,
        hasCredentials: serverHasCredentials,
        serverHasCredentials,
        credParams: {},
      }}
    >
      {children}
    </CredentialsContext.Provider>
  );
}

export const useCredentials = () => useContext(CredentialsContext);
