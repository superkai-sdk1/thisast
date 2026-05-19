import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Эста CRM',
    short_name: 'Эста CRM',
    description: 'Интеллектуальная CRM для агентства недвижимости',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F2F2F7',
    theme_color: '#007AFF',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon.svg',     sizes: 'any',      type: 'image/svg+xml', purpose: 'maskable' },
      { src: '/icons/icon-192.png', sizes: '192x192',  type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512',  type: 'image/png' },
    ],
    screenshots: [],
  };
}
