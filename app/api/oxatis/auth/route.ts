import { getStockBySKU } from "@/lib/oxatis-api";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { appId?: unknown; token?: unknown };
    const { appId, token } = body;
    if (typeof appId !== "string" || typeof token !== "string" || !appId || !token) {
      return Response.json({ error: "Identifiants manquants" }, { status: 400 });
    }
    const xml = await getStockBySKU(appId, token, "__test__");
    if (xml.includes("<StatusCode>503</StatusCode>")) {
      return Response.json({ error: "Identifiants invalides (503 Unauthorized)" }, { status: 401 });
    }
    const cookieStore = await cookies();
    cookieStore.set("oxatis_credentials", JSON.stringify({ appId, token }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("oxatis_credentials");
  return Response.json({ success: true });
}
