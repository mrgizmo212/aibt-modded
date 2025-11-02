/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site deployment on Render
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // Required for static export
  },
  experimental: {
    turbo: {
      root: process.cwd(),  // Explicitly set workspace root to current directory
    },
  },
}

export default nextConfig
