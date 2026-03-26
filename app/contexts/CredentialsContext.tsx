"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CredentialsContextValue {
  appId: string;
  token: string;
  setCredentials: (appId: string, token: string) => void;
  /** True if the client has entered credentials OR if the server has env credentials */
  hasCredentials: boolean;
  /** True if the server has OXATIS_APP_ID / OXATIS_TOKEN env vars configured */
  serverHasCredentials: boolean;
  /** Credential params to append to API requests — empty object if server has creds */
  credParams: { appId?: string; token?: string };
}

const CredentialsContext = createContext<CredentialsContextValue>({
  appId: "",
  token: "",
  setCredentials: () => {},
  hasCredentials: false,
  serverHasCredentials: false,
  credParams: {},
});

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [appId, setAppId] = useState("");
  const [token, setToken] = useState("");
  const [serverHasCredentials, setServerHasCredentials] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("oxatis_credentials");
      if (saved) {
        const c = JSON.parse(saved);
        setAppId(c.appId ?? "");
        setToken(c.token ?? "");
      }
    } catch {}

    fetch("/api/oxatis/config")
      .then((r) => r.json())
      .then((d) => setServerHasCredentials(!!d.hasCredentials))
      .catch(() => {});
  }, []);

  const setCredentials = (a: string, t: string) => {
    setAppId(a);
    setToken(t);
    try {
      localStorage.setItem("oxatis_credentials", JSON.stringify({ appId: a, token: t }));
    } catch {}
  };

  const hasCredentials = serverHasCredentials || !!(appId && token);
  const credParams = serverHasCredentials ? {} : { appId, token };

  return (
    <CredentialsContext.Provider
      value={{ appId, token, setCredentials, hasCredentials, serverHasCredentials, credParams }}
    >
      {children}
    </CredentialsContext.Provider>
  );
}

export const useCredentials = () => useContext(CredentialsContext);
