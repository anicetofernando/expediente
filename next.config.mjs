/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
    outputFileTracingIncludes: {
      "/api/documents/*/pdf/route": ["node_modules/@sparticuz/chromium/bin/**"],
      "/api/documents/*/pdf": ["node_modules/@sparticuz/chromium/bin/**"],
    },
  },
  // Evita que `next dev` substitua os chunks CSS/JS de um build que esteja
  // a ser servido por `next start`.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
