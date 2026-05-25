import type { NextConfig } from "next";

// Ensure node is findable by Turbopack's child processes
if (!process.env.PATH?.includes("/usr/local/bin")) {
  process.env.PATH = `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ""}`;
}

const nextConfig: NextConfig = {};

export default nextConfig;
