import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5050",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "5050",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5050",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/notifications/:path*",
        destination: "http://127.0.0.1:5050/api/notifications/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:5050/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
