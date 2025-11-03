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
}

module.exports = nextConfig
