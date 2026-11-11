import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { SITE_URL, DRAFT_PATHS } from './site.config.mjs';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    // Las guías van en MDX. Los enlaces salientes se escriben con
    // target="_blank" rel="noopener" a mano, y check:content lo vigila.
    mdx(),
    sitemap({
      filter: (page) => !DRAFT_PATHS.some((p) => page.endsWith(p)),
    }),
  ],
  devToolbar: { enabled: false },
});
