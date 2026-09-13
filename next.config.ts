import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Packs de figurinhas/arquivos podem ser maiores que o limite padrão de 1MB.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
