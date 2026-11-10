import type { NextConfig } from "next";
const config: NextConfig = { experimental: { serverActions: { bodySizeLimit: "3.5mb" } } };
export default config;
