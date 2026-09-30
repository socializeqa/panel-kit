import type { NextConfig } from "next";

// What every app adds to take the kit: it ships TypeScript source, so Next
// compiles it with the app.
const nextConfig: NextConfig = {
  transpilePackages: ["@socialize/panel-kit"],
};

export default nextConfig;
