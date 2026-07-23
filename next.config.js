/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["postgres", "web-tree-sitter", "@huggingface/transformers", "onnxruntime-node", "sharp"]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      externals.push("path", "fs/promises", "module", "url", "net", "tls", "crypto", "stream", /^web-tree-sitter(\/|$)/, /^postgres(\/|$)/, "onnxruntime-node", "sharp");
      externals.push(({context, request}, callback) => {
        if (request === "@huggingface/transformers" || request.startsWith("@huggingface/transformers/")) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
      config.externals = externals;
      config.optimization = { ...config.optimization, concatenateModules: false };
    } else {
      const webpack = require("webpack");
      config.plugins = [
        ...(config.plugins || []),
        new webpack.IgnorePlugin({
          resourceRegExp: /@huggingface\/transformers|onnxruntime-node|sharp/
        })
      ];
    }
    return config;
  }
};
module.exports = nextConfig;
