/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable dynamic routes and server features
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,  // Can use optimized images now
  },
}

export default nextConfig
