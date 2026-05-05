import { NextRequest } from "next/server";

export function getCredentials(
  request: NextRequest,
  fallbackAppId?: string | null,
  fallbackToken?: string | null
): { appId: string; token: string } {
  if (process.env.OXATIS_APP_ID && process.env.OXATIS_TOKEN) {
    return { appId: process.env.OXATIS_APP_ID, token: process.env.OXATIS_TOKEN };
  }
  const cookieVal = request.cookies.get("oxatis_credentials")?.value;
  if (cookieVal) {
    try {
      const c = JSON.parse(cookieVal) as { appId?: unknown; token?: unknown };
      if (typeof c.appId === "string" && typeof c.token === "string" && c.appId && c.token) {
        return { appId: c.appId, token: c.token };
      }
    } catch {}
  }
  return { appId: fallbackAppId || "", token: fallbackToken || "" };
}

export function hasEnvCredentials(): boolean {
  return !!(process.env.OXATIS_APP_ID && process.env.OXATIS_TOKEN);
}
