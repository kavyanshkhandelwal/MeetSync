import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://10.135.125.247:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
