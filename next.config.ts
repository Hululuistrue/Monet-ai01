import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 设置输出文件追踪根目录
  outputFileTracingRoot: __dirname,
  // 优化Windows环境下的构建
  webpack: (config) => {
    // 避免Windows路径问题
    config.resolve.symlinks = false;
    return config;
  },
  // 暂时放松ESLint检查以便部署
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  // TypeScript检查配置
  typescript: {
    ignoreBuildErrors: false,
  },
  // 实验性功能
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;
