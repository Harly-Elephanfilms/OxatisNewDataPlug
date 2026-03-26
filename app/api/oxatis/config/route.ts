import { hasEnvCredentials } from "@/lib/server-credentials";

export async function GET() {
  return Response.json({
    hasCredentials: hasEnvCredentials(),
  });
}
