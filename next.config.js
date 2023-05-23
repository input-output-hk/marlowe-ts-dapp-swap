/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['marlowe-ts-sdk'],
  reactStrictMode: false,
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait : true,
    };
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
};
module.exports = nextConfig;
