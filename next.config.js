/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/@prisma/client/**/*', './node_modules/.prisma/**/*'],
  },
  // Ensure static assets are properly served
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || undefined,
}

module.exports = nextConfig
