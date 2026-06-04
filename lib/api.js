// ─── API ──────────────────────────────────────────────────────────────────────
export const api = async (path, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hv_token') : null;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = 'Erro';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
};

export const MAX_IMAGE_SIZE_MB = 2;

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    reject(new Error(`"${file.name}" excede ${MAX_IMAGE_SIZE_MB}MB.`));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  reader.readAsDataURL(file);
});

export const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Design tokens ────────────────────────────────────────────────────────────
export const G = {
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
  pill: 'rounded-full',
  card: 'rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm',
  btn: 'rounded-xl font-medium transition-all active:scale-[0.98]',
  input: 'rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-visible:ring-emerald-500',
  section: 'container mx-auto px-4 sm:px-6',
  fadeUp: 'animate-[fadeUp_0.45s_ease_both]',
};

// ─── Catalog prefetch cache ───────────────────────────────────────────────────
export const _catalogCache = {
  species: null,
  categories: null,
  promise: null,
};

export function warmCatalogCache() {
  if (_catalogCache.promise) return;
  _catalogCache.promise = Promise.all([
    api('/species').then((d) => { _catalogCache.species = d; }),
    api('/categories').then((d) => { _catalogCache.categories = d; }),
  ]).catch(() => {});
}
