import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Habilita bindings de Cloudflare en `next dev`
initOpenNextCloudflareForDev();
