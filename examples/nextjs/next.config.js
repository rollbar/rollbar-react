/** @type {import('next').NextConfig} */
module.exports = {
  /* config options here */
  reactStrictMode: true,
  // This example lives inside the @rollbar/react repo, so Next.js would
  // otherwise infer the repo root as the workspace root.
  outputFileTracingRoot: __dirname,
};
