/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // TypeScript 5.x exposes the compiler API; avoiding the CLI prevents a
    // Next 16 CLI configuration parsing failure during production builds.
    useTypeScriptCli: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
