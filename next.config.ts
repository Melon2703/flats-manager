import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the project's existing agent guidance intact during development.
  agentRules: false,
};

export default nextConfig;
