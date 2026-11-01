import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { writePrerenderedPages } from './src/prerender.js';

const root = dirname(fileURLToPath(import.meta.url));

// Relative asset URLs keep one build working in two places. An inline script
// sets <base> to the deploy prefix (site root on Cloudflare Pages, the
// project path on GitHub Pages) so deep links still load /assets.
function prerenderRoutes() {
  return {
    name: 'prerender-routes',
    closeBundle() {
      const distDir = resolve(root, 'dist');
      const template = readFileSync(resolve(distDir, 'index.html'), 'utf8');
      writePrerenderedPages(distDir, template);
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [prerenderRoutes()],
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
