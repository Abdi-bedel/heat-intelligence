import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@heat/contracts', '@heat/ui'],
};

export default config;
