/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site deployment on Render
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // Required for static export
  },
  turbopack: {
    root: '.',  // Force Turbopack to use current directory as root
  },
}

export default nextConfig
