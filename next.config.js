/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['marlowe-ts-sdk'],
  async rewrites() {
    return [
      {
        source: '/marlowe/runtime/:path*',
        destination: 'http://0.0.0.0:32943/:path*',
      },
    ]
  },
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
