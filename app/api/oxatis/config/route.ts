import { hasEnvCredentials } from "@/lib/server-credentials";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const hasCookie = !!request.cookies.get("oxatis_credentials")?.value;
  return Response.json({
    hasCredentials: hasEnvCredentials() || hasCookie,
  });
}
