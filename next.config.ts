import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "battleground-info.vercel.app" }],
        destination: "https://bgi.pwkor.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
