/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_FIREBASE_CONFIG_DEV: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DEV,
    NEXT_PUBLIC_FIREBASE_CONFIG_PROD: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROD,
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  }
};

module.exports = nextConfig;