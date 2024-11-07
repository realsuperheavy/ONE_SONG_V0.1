/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_CONFIG_DEV: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DEV,
    NEXT_PUBLIC_FIREBASE_CONFIG_PROD: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROD,
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID_DEV: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID_DEV,
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID_PROD: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID_PROD,
  },
  // Ensure images from Spotify can be loaded
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co'],
  },
};

module.exports = nextConfig;
