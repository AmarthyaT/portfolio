import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://amarthya.netlify.app',
  /* Astro's condenser eats the newline between an inline tag and the next word,
     which silently welds words together. Keep the source whitespace intact. */
  compressHTML: false,
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
