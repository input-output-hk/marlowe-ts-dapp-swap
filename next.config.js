/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['marlowe-ts-sdk-beta'],
  reactStrictMode: false,
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
    };
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });
    return config;
  },
};
module.exports = nextConfig;
