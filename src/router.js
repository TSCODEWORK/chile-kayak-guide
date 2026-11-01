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
  let normalized = !path || path === '/' ? '/' : path.replace(/\/$/, '') || '/';
  let lang = 'en';
  if (normalized === '/es' || normalized.startsWith('/es/')) {
    lang = 'es';
    normalized = normalized === '/es' ? '/' : (normalized.slice(3) || '/');
    if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  }
  if (normalized === '/with') return { name: 'with', lang };
  const region = normalized.match(/^\/region\/([^/]+)$/);
  if (region) return { name: 'region', id: safeDecode(region[1]), lang };
  const river = normalized.match(/^\/river\/([^/]+)$/);
  if (river) return { name: 'river', id: safeDecode(river[1]), lang };
  return { name: 'home', lang };
}

export function parseLocation({ pathname = '/', hash = '', base = '/' } = {}) {
  if (typeof hash === 'string' && hash.startsWith('#/')) {
    return parseRoutePath(hash.slice(1));
  }
  return parseRoutePath(stripBase(pathname, base));
}

export function toPath(route) {
  let path = '/';
  if (route?.name === 'region' && route.id) path = `/region/${encodeURIComponent(route.id)}`;
  else if (route?.name === 'river' && route.id) path = `/river/${encodeURIComponent(route.id)}`;
  else if (route?.name === 'with') path = '/with';
  if (route?.lang === 'es') return path === '/' ? '/es' : `/es${path}`;
  return path;
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
