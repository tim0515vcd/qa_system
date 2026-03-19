import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedDevOrigins: ["10.16.43.66", "localhost:3000"]
    }
  }
};

export default withNextIntl(nextConfig);
