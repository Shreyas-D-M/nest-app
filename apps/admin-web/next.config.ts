import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Workspace packages ship compiled CommonJS. Listing them here lets Next
  // process them as first-party source rather than treating them as external
  // pre-bundled dependencies.
  transpilePackages: ['@nest/tokens', '@nest/types', '@nest/i18n'],

  // Do not leak framework details in response headers.
  poweredByHeader: false,
};

export default nextConfig;
