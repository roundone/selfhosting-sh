import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://selfhosting.sh',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/draft'),
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
