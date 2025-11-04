/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ✅ Required for Render Static Site (free tier)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // ✅ Required for static export
  },
}

export default nextConfig
