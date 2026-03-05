import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: isGhPages ? "export" : undefined,
  basePath: isGhPages ? "/Gorchev-V" : "",
  assetPrefix: isGhPages ? "/Gorchev-V/" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
