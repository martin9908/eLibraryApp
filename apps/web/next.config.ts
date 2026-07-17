import path from 'node:path';
import type { NextConfig } from 'next';

// pdfjs-dist (via react-pdf) optionally requires the Node-only `canvas` module.
// The browser never uses it, so alias it to an empty stub for both bundlers.
const canvasStub = path.resolve(process.cwd(), 'pdf-canvas-stub.js');

const nextConfig: NextConfig = {
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
            // Allow Wikia/Fandom cover images used for sample/demo book data
            { protocol: 'https', hostname: 'static.wikia.nocookie.net' },
        ],
    },
};

export default nextConfig;
