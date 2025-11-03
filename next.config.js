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
  // Ensure environment variables are available at runtime
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
