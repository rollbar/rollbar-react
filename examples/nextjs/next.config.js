/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    POST_CLIENT_ITEM_ACCESS_TOKEN: process.env.POST_CLIENT_ITEM_ACCESS_TOKEN,
  }
}

module.exports = nextConfig
