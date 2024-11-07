/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Required for static exports
  images: {
    unoptimized: true // Required for static exports
  },
  env: {
    NEXT_PUBLIC_FIREBASE_CONFIG_DEV: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DEV,
    NEXT_PUBLIC_FIREBASE_CONFIG_PROD: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROD,
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  }
};

module.exports = nextConfig;