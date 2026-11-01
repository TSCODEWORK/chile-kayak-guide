import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';

// Relative asset URLs keep one build working in two places. An inline script
// sets <base> to the deploy prefix (site root on Cloudflare Pages, the
// project path on GitHub Pages) so deep links still load /assets.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [spaFallback()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
});
