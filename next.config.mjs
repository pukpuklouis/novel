/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DIFY_API_KEY: process.env.DIFY_API_KEY,
  },
}

export default nextConfig;