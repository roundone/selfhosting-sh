import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://selfhosting.sh',
  trailingSlash: 'always',
  prefetch: true,
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/draft') &&
        !page.includes('/search') &&
        !page.includes('/404'),
      lastmod: new Date(),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  build: {
    format: 'directory',
  },
});
