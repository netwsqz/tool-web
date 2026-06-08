import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.cpolar.top", "10.2.3.1", "10.2.*.*"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

// Bundle analyzer (ANALYZE=true npm run analyze)
let config: NextConfig = nextConfig;
if (process.env.ANALYZE === "true") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: true });
  config = withBundleAnalyzer(config);
}

export default config;
