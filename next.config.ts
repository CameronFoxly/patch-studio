import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGhPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(isGhPages
    ? {
        basePath: "/patch-studio",
        assetPrefix: "/patch-studio/",
      }
    : {}),
};

export default nextConfig;
