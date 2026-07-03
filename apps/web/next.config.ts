import path from 'node:path';
import type { NextConfig } from 'next';

// pdfjs-dist (via react-pdf) optionally requires the Node-only `canvas` module.
// The browser never uses it, so alias it to an empty stub for both bundlers.
const canvasStub = path.resolve(process.cwd(), 'pdf-canvas-stub.js');

const nextConfig: NextConfig = {
    // The monorepo root lints with eslint-config-expo (from the RN app), which
    // lacks the Next.js plugin — so Next's build-time lint can't resolve rules
    // like @next/next/no-img-element. Skip lint during build; type-checking
    // still runs. Lint the web app separately once eslint-config-next is added.
    eslint: { ignoreDuringBuilds: true },
    turbopack: {
        resolveAlias: { canvas: './pdf-canvas-stub.js' },
    },
    webpack: (config) => {
        config.resolve = config.resolve ?? {};
        config.resolve.alias = { ...config.resolve.alias, canvas: canvasStub };
        return config;
    },
    images: {
        remotePatterns: [
            // Allow Firebase Storage images
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
            // Allow placeholder services in development
            { protocol: 'https', hostname: 'placehold.co' },
        ],
    },
};

export default nextConfig;
