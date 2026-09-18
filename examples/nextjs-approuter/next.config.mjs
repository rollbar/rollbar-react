import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This example lives inside the @rollbar/react repo, so Next.js would
  // otherwise infer the repo root as the workspace root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
