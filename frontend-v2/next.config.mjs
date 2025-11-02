/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site deployment on Render
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // Required for static export
  },
  // Explicitly configure module resolution for Turbopack
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './',
        '@/*': './*',
      },
    },
  },
}

export default nextConfig
