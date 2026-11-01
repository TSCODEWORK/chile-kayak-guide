import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { REGIONS, RIVERS } from './data/rivers-data.js';

const SAFE_ID = /^[a-z0-9-]+$/;

export function siteOrigin() {
  return (process.env.SITE_URL || 'https://chile-kayak-guide.pages.dev').replace(/\/$/, '');
}

export function summarize(text, max = 155) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut || clean.slice(0, max - 1)}…`;
}

export function pages() {
  const home = {
    path: '/',
    title: 'Chile Kayak Guide · Whitewater atlas',
    description: `A whitewater kayaking atlas of Chile: ${RIVERS.length} runs across ${REGIONS.length} regions, from the Maipo to the Baker. Flow ranges, grades, rapids, access, and live gauges.`
  };
  const regions = REGIONS.map((region) => {
    assertSafeId(region.id);
    return {
      path: `/region/${region.id}`,
      title: `${region.name} · Chile Kayak Guide`,
      description: summarize(region.overview)
    };
  });
  const rivers = RIVERS.map((river) => {
    assertSafeId(river.id);
    return {
      path: `/river/${river.id}`,
      title: `${river.name} · Chile Kayak Guide`,
      description: summarize(`${river.name} — ${river.section}. Class ${river.grade} in ${river.regionName}. ${river.davidBeta}`)
    };
  });
  return [home, ...regions, ...rivers];
}

// Cloudflare Pages serves `/route` from `route.html` (HTTP 200) and
// `/route/` from `route/index.html` (HTTP 200). GitHub Pages serves the
// directory index, and redirects the no-slash URL onto it.
export function filesFor(page) {
  if (page.path === '/') return ['index.html'];
  const clean = page.path.replace(/^\//, '').replace(/\/$/, '');
  return [`${clean}.html`, `${clean}/index.html`];
}

export function applyMeta(html, page) {
  const title = escapeAttr(page.title);
  const description = escapeAttr(page.description);
  const url = escapeAttr(pageUrl(page.path));
  let out = html;
  out = replaceOnce(out, /<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title');
  out = replaceOnce(out, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
  out = replaceOnce(out, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`, 'og:title');
  out = replaceOnce(out, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'og:description');
  if (out.includes('rel="canonical"') || out.includes('property="og:url"')) {
    throw new Error('template already has canonical or og:url');
  }
  const tags = `  <link rel="canonical" href="${url}">\n  <meta property="og:url" content="${url}">\n`;
  out = out.replace('</head>', `${tags}</head>`);
  return out;
}

export function writePrerenderedPages(distDir, template) {
  const written = [];
  for (const page of pages()) {
    const html = applyMeta(template, page);
    for (const relative of filesFor(page)) {
      const dest = join(distDir, relative);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, html);
      written.push(relative);
    }
  }
  return written;
}

function pageUrl(path) {
  if (path === '/') return `${siteOrigin()}/`;
  return `${siteOrigin()}${path}`;
}

function assertSafeId(id) {
  if (!SAFE_ID.test(id)) throw new Error(`Refusing to prerender unsafe id: ${id}`);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Built HTML is missing ${label}`);
  return html.replace(pattern, replacement);
}
