/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site deployment on Render
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // Required for static export
  },
  webpack: (config) => {
    // Ensure webpack respects tsconfig path aliases
    return config
  },
}

export default nextConfig
