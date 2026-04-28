import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '***REMOVED***';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '***REMOVED***';

// ---------------- In-memory store ----------------
// Using globalThis so HMR (hot module reload) in dev doesn't wipe the data on every code change.
function createStore() {
  return {
    users: [],
    categories: [],
    species: [],
    team: [],
    initialized: false,
  };
}
if (!globalThis.__hv_store) {
  globalThis.__hv_store = createStore();
}
const store = globalThis.__hv_store;

async function ensureInit() {
  if (store.initialized) return;
  // Seed admin
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  store.users.push({
    id: uuidv4(),
    email: ADMIN_EMAIL,
    password: hash,
    role: 'admin',
    createdAt: new Date().toISOString(),
  });
  // Seed default categories
  const defaults = ['Árvore', 'Arbusto', 'Herbácea', 'Medicinal', 'Frutífera', 'Ornamental', 'Palmeira'];
  defaults.forEach((name) => {
    store.categories.push({ id: uuidv4(), name, createdAt: new Date().toISOString() });
  });
  store.initialized = true;
}

// ---------------- Auth helpers ----------------
function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
function requireAdmin(request) {
  const payload = getToken(request);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// ---------------- Utils ----------------
function findById(arr, id) { return arr.find((x) => x.id === id); }
function removeById(arr, id) {
  const idx = arr.findIndex((x) => x.id === id);
  if (idx !== -1) arr.splice(idx, 1);
  return idx !== -1;
}
function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Array.from(
    rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set())
  );
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v) || typeof v === 'object') v = JSON.stringify(v);
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => escape(r[k])).join(','))].join('\n');
}
function stripImagesForExport(rows) {
  return rows.map((r) => {
    const c = { ...r };
    if (c.images) c.images = `[${(c.images || []).length} imagens]`;
    if (c.photo) c.photo = c.photo ? '[foto]' : '';
    return c;
  });
}

// ---------------- Main handler ----------------
async function handle(request, { params }) {
  await ensureInit();
  const segments = params?.path || [];
  const path = '/' + segments.join('/');
  const method = request.method;

  try {
    // ---------- AUTH ----------
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      const user = store.users.find((u) => u.email === (email || '').toLowerCase().trim());
      if (!user) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      const ok = await bcrypt.compare(password || '', user.password);
      if (!ok) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return NextResponse.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }

    if (path === '/auth/me' && method === 'GET') {
      const payload = getToken(request);
      if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      return NextResponse.json({ user: { id: payload.id, email: payload.email, role: payload.role } });
    }

    // ---------- CATEGORIES ----------
    if (path === '/categories' && method === 'GET') {
      const items = [...store.categories].sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(items);
    }
    if (path === '/categories' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const { name } = await request.json();
      if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
      if (store.categories.find((c) => c.name === name.trim())) return NextResponse.json({ error: 'Categoria já existe' }, { status: 400 });
      const cat = { id: uuidv4(), name: name.trim(), createdAt: new Date().toISOString() };
      store.categories.push(cat);
      return NextResponse.json(cat);
    }
    if (path.startsWith('/categories/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const { name } = await request.json();
      const cat = findById(store.categories, id);
      if (!cat) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
      cat.name = (name || '').trim();
      // Update categoryName in species referencing this category
      store.species.forEach((s) => { if (s.categoryId === id) s.categoryName = cat.name; });
      return NextResponse.json(cat);
    }
    if (path.startsWith('/categories/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      removeById(store.categories, id);
      return NextResponse.json({ ok: true });
    }

    // ---------- SPECIES ----------
    if (path === '/species' && method === 'GET') {
      const url = new URL(request.url);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const category = url.searchParams.get('category') || '';
      let items = [...store.species];
      if (category) items = items.filter((s) => s.categoryId === category);
      if (search) {
        items = items.filter((s) =>
          (s.scientificName || '').toLowerCase().includes(search) ||
          (s.commonName || '').toLowerCase().includes(search) ||
          (s.family || '').toLowerCase().includes(search)
        );
      }
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      return NextResponse.json(items);
    }
    if (path === '/species' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const body = await request.json();
      const cat = body.categoryId ? findById(store.categories, body.categoryId) : null;
      const doc = {
        id: uuidv4(),
        scientificName: body.scientificName || '',
        commonName: body.commonName || '',
        family: body.family || '',
        categoryId: body.categoryId || '',
        categoryName: cat?.name || '',
        description: body.description || '',
        characteristics: body.characteristics || '',
        location: body.location || '',
        images: Array.isArray(body.images) ? body.images : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.species.push(doc);
      return NextResponse.json(doc);
    }
    if (path.startsWith('/species/') && method === 'GET') {
      const id = segments[1];
      const item = findById(store.species, id);
      if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
      return NextResponse.json(item);
    }
    if (path.startsWith('/species/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const body = await request.json();
      const item = findById(store.species, id);
      if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
      const cat = body.categoryId ? findById(store.categories, body.categoryId) : null;
      Object.assign(item, {
        scientificName: body.scientificName || '',
        commonName: body.commonName || '',
        family: body.family || '',
        categoryId: body.categoryId || '',
        categoryName: cat?.name || '',
        description: body.description || '',
        characteristics: body.characteristics || '',
        location: body.location || '',
        images: Array.isArray(body.images) ? body.images : [],
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(item);
    }
    if (path.startsWith('/species/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      removeById(store.species, segments[1]);
      return NextResponse.json({ ok: true });
    }

    // ---------- TEAM ----------
    if (path === '/team' && method === 'GET') {
      const items = [...store.team].sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
      return NextResponse.json(items);
    }
    if (path === '/team' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        name: body.name || '',
        role: body.role || '',
        description: body.description || '',
        photo: body.photo || '',
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        isMainCreator: !!body.isMainCreator,
        order: typeof body.order === 'number' ? body.order : store.team.length,
        createdAt: new Date().toISOString(),
      };
      if (doc.isMainCreator) store.team.forEach((m) => { m.isMainCreator = false; });
      store.team.push(doc);
      return NextResponse.json(doc);
    }
    if (path.startsWith('/team/') && segments[1] === 'reorder' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const { ids } = await request.json();
      if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids array obrigatório' }, { status: 400 });
      ids.forEach((id, i) => {
        const m = findById(store.team, id);
        if (m) m.order = i;
      });
      return NextResponse.json({ ok: true });
    }
    if (path.startsWith('/team/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const body = await request.json();
      const member = findById(store.team, id);
      if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
      if (body.isMainCreator) store.team.forEach((m) => { if (m.id !== id) m.isMainCreator = false; });
      Object.assign(member, {
        name: body.name || '',
        role: body.role || '',
        description: body.description || '',
        photo: body.photo || '',
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        isMainCreator: !!body.isMainCreator,
      });
      if (typeof body.order === 'number') member.order = body.order;
      return NextResponse.json(member);
    }
    if (path.startsWith('/team/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      removeById(store.team, segments[1]);
      return NextResponse.json({ ok: true });
    }

    // ---------- EXPORT ----------
    if (path === '/export' && method === 'GET') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const url = new URL(request.url);
      const type = url.searchParams.get('type') || 'species';
      const format = url.searchParams.get('format') || 'json';
      const data = type === 'team' ? store.team : type === 'categories' ? store.categories : store.species;
      const cleaned = stripImagesForExport(data);
      if (format === 'csv') {
        return new NextResponse(toCSV(cleaned), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${type}.csv"`,
          },
        });
      }
      return new NextResponse(JSON.stringify(cleaned, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${type}.json"`,
        },
      });
    }

    // ---------- STATS ----------
    if (path === '/stats' && method === 'GET') {
      return NextResponse.json({
        speciesCount: store.species.length,
        teamCount: store.team.length,
        categoriesCount: store.categories.length,
      });
    }

    if (path === '' || path === '/') {
      return NextResponse.json({ name: 'Herança Verde API', status: 'ok', mode: 'in-memory' });
    }

    return NextResponse.json({ error: 'Endpoint não encontrado', path, method }, { status: 404 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
