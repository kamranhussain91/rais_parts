/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // qrcode + node:crypto run in API routes; keep them out of the client/edge bundle.
  serverExternalPackages: ["qrcode"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
