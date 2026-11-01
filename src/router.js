export function stripBase(pathname, base = '/') {
  let path = pathname || '/';
  if (base !== '/') {
    const baseTrim = base.endsWith('/') ? base.slice(0, -1) : base;
    const baseSlash = base.endsWith('/') ? base : `${base}/`;
    if (path === base || path === baseTrim || path === baseSlash) return '/';
    if (path.startsWith(baseSlash)) path = `/${path.slice(baseSlash.length)}`;
  }
  path = path.replace(/\/index\.html$/, '') || '/';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (!path.startsWith('/')) path = `/${path}`;
  return path || '/';
}

export function parseRoutePath(path) {
  const normalized = !path || path === '/' ? '/' : path.replace(/\/$/, '');
  const region = normalized.match(/^\/region\/([^/]+)$/);
  if (region) return { name: 'region', id: safeDecode(region[1]) };
  const river = normalized.match(/^\/river\/([^/]+)$/);
  if (river) return { name: 'river', id: safeDecode(river[1]) };
  return { name: 'home' };
}

export function parseLocation({ pathname = '/', hash = '', base = '/' } = {}) {
  if (typeof hash === 'string' && hash.startsWith('#/')) {
    return parseRoutePath(hash.slice(1));
  }
  return parseRoutePath(stripBase(pathname, base));
}

export function toPath(route) {
  if (route?.name === 'region' && route.id) return `/region/${encodeURIComponent(route.id)}`;
  if (route?.name === 'river' && route.id) return `/river/${encodeURIComponent(route.id)}`;
  return '/';
}

export function joinBase(base = '/', routePath = '/') {
  const root = !base || base === '/' ? '/' : (base.endsWith('/') ? base : `${base}/`);
  if (!routePath || routePath === '/') return root;
  const suffix = routePath.startsWith('/') ? routePath.slice(1) : routePath;
  return root === '/' ? `/${suffix}` : `${root}${suffix}`;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
