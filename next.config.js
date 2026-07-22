/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["pg", "postgres"]
  }
};
module.exports = nextConfig;
