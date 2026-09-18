/** @type {import('next').NextConfig} */
const backendUrl = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000"
).replace(/\/$/, "");

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/students/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/api/students/**",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/api/students/**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
