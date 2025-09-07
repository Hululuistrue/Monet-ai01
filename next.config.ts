import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 优化Windows环境下的构建
  webpack: (config, { isServer }) => {
    // 避免Windows路径问题
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
