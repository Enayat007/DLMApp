/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the .NET backend in development
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
