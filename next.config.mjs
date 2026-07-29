/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que `next dev` substitua os chunks CSS/JS de um build que esteja
  // a ser servido por `next start`.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
