/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true, // For development - remove in production
  },
  webpack: (config, { isServer }) => {
    // Exclude firebase-admin and Node.js built-ins from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        'firebase-admin': false,
      }
    }
    return config
  },
}

export default nextConfig
