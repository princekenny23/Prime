/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  async redirects() {
    return [
      // Redirect old "wholesale and retail" routes to "retail"
      {
        source: '/dashboard/wholesale%20and%20retail',
        destination: '/dashboard/retail',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale%20and%20retail/:path*',
        destination: '/dashboard/retail/:path*',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale and retail',
        destination: '/dashboard/retail',
        permanent: false,
      },
      {
        source: '/dashboard/wholesale and retail/:path*',
        destination: '/dashboard/retail/:path*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig

