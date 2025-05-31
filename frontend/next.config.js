/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/embedding-modifier-v2",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
