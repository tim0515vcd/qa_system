import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedDevOrigins: ["10.16.43.66", "localhost:3000"]
    }
  }
};

export default nextConfig;
