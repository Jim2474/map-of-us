import type { NextConfig } from "next";

const isMobileBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
