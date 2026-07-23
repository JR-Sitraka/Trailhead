/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["postgres", "web-tree-sitter"]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      externals.push("path", "fs/promises", "module", "url", "net", "tls", "crypto", "stream", /^web-tree-sitter(\/|$)/, /^postgres(\/|$)/);
      config.externals = externals;
    }
    return config;
  }
};
module.exports = nextConfig;
