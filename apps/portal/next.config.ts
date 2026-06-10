import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@heat/contracts', '@heat/ui'],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
