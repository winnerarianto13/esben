import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https', // Gunakan https karena domain esbeg sudah pakai SSL
        hostname: 'api-backend.esbeg.com',
        port: '', // Kosongkan jika menggunakan port standar 443
        pathname: '/storage/**',
      },
      // Kamu tetap bisa mempertahankan IP lokal untuk development jika perlu
      {
        protocol: 'http',
        hostname: '192.168.2.35',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io', // Tambahkan ini
      },
    ],
  },
};

export default nextConfig;