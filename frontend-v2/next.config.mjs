/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using Web Service deployment - no 'output: export' needed
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,  // Image optimization enabled for Web Service
  },
}

export default nextConfig
