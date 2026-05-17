import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许 /uploads 静态文件通过 Next.js 直接访问
  output: "standalone",
};

export default nextConfig;
