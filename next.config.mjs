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
        http2: false,
        'firebase-admin': false,
      }
      
      // Ignore Node.js protocol imports (node:events, node:process, etc.)
      config.externals = config.externals || []
      config.externals.push({
        'node:events': 'commonjs events',
        'node:process': 'commonjs process',
        'node:stream': 'commonjs stream',
        'node:util': 'commonjs util',
        'node:http2': 'commonjs http2',
      })
    }
    return config
  },
}

export default nextConfig
