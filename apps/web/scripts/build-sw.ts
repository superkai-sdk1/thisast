/**
 * Post-build script: generates /public/sw.js via Workbox.
 * Run with: npx tsx scripts/build-sw.ts
 */
import { generateSW } from 'workbox-build';
import path from 'path';

const distDir = path.resolve(process.cwd(), '.next');
const publicDir = path.resolve(process.cwd(), 'public');

async function main() {
  const { count, size } = await generateSW({
    swDest: path.join(publicDir, 'sw.js'),
    globDirectory: path.join(distDir, 'static'),
    globPatterns: ['**/*.{js,css,woff2}'],

    runtimeCaching: [
      {
        // App shell — JS/CSS: cache-first
        urlPattern: /\/_next\/static\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // API GET responses: stale-while-revalidate, up to 200 entries
        urlPattern: /\/api\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 200 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Images (MinIO/imgproxy): cache-first, 500 entries, 7 days
        urlPattern: /\.(jpg|jpeg|png|webp|avif|svg)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Navigation: network-first with offline fallback
        urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 5,
        },
      },
    ],

    // Push notification handler injected into SW
    additionalManifestEntries: [],
    inlineWorkboxRuntime: true,
    sourcemap: false,
  });

  console.log(`✓ Service worker generated — ${count} entries, ${(size / 1024).toFixed(1)} KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
