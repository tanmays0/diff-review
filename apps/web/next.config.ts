import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@diff-review/core", "@diff-review/db"],
  outputFileTracingRoot: root,
};

export default nextConfig;
