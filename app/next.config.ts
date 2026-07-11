import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@skilletfresh/contracts", "@skilletfresh/db"],
};

export default nextConfig;
