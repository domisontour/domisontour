// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.domisontour.ch',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
