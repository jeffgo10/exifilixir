/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js',
});

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for Firebase Hosting
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features for static export
  trailingSlash: true, // Helps with Firebase Hosting routing
  transpilePackages: ['@jeffgo10/panorama-viewer', '@jeffgo10/helpers'],
};

module.exports = withPWA(nextConfig);
