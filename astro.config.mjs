// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.domisontour.ch',
  trailingSlash: 'ignore',
  // alte Portfolio-Adressen zeigen auf die neue UGC-Welt
  redirects: {
    '/portfolio': '/ugc/',
    '/en/portfolio': '/en/ugc/',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/portfolio'),
      i18n: { defaultLocale: 'de', locales: { de: 'de-CH', en: 'en' } },
    }),
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
