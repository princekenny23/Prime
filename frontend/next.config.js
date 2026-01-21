/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize build performance
  experimental: {
    optimizeCss: true,
  },
  // Exclude backend and other non-frontend files from webpack
  webpack: (config, { isServer }) => {
    // Exclude backend Python files and other non-frontend directories
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/.next',
        '**/backend/**',
        '**/__pycache__/**',
        '**/env/**',
        '**/.venv/**',
        '**/templates/**',
        '**/*.md',
        '**/pyrightconfig.json',
        '**/manage.py',
        '**/requirements.txt',
      ],
    };
    return config;
  },
  async redirects() {
    return [
      // Redirect old "wholesale and retail" routes to main dashboard (MVP retail removed)
      {
        source: '/dashboard/wholesale%20and%20retail',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale%20and%20retail/:path*',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale and retail',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale and retail/:path*',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig

