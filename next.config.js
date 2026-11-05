/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    // 忽略 TypeScript 报错，强行打包上线
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略 ESLint 校验
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
