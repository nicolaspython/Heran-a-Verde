import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'heranca_verde';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'nicolaaaasxd@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'n!colas0202';

// ---------------- MongoDB connection (cached for serverless) ----------------
async function getDb() {
  if (!globalThis.__hv_mongo) {
    const client = new MongoClient(MONGO_URL, { maxPoolSize: 10 });
    await client.connect();
    globalThis.__hv_mongo = client;
  }
  return globalThis.__hv_mongo.db(DB_NAME);
}

// ---------------- Init: seed admin + default categories + settings ----------------
async function ensureInit(db) {
  if (!globalThis.__hv_init_done) {
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('species').createIndex({ id: 1 }, { unique: true });
      await db.collection('species').createIndex({ scientificName: 'text', commonName: 'text', family: 'text' });
      await db.collection('team').createIndex({ id: 1 }, { unique: true });
      await db.collection('categories').createIndex({ id: 1 }, { unique: true });
    } catch {}
    globalThis.__hv_init_done = true;
  }

  const adminExists = await db.collection('users').findOne({ email: ADMIN_EMAIL });
  if (!adminExists) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.collection('users').insertOne({
      id: uuidv4(),
      email: ADMIN_EMAIL,
      password: hash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
  }

  const catsCount = await db.collection('categories').countDocuments();
  if (catsCount === 0) {
    const defaults = ['Árvore', 'Arbusto', 'Herbácea', 'Medicinal', 'Frutífera', 'Ornamental', 'Palmeira'];
    await db.collection('categories').insertMany(
      defaults.map((name) => ({ id: uuidv4(), name, createdAt: new Date().toISOString() }))
    );
  }

  const settings = await db.collection('settings').findOne({ id: 'global' });
  if (!settings) {
    await db.collection('settings').insertOne({
      id: 'global',
      aboutTitle: 'Sobre o Projeto',
      aboutIntro: 'O Herança Verde é uma iniciativa do Liceu de Messejana, em Fortaleza/CE, dedicada a catalogar, preservar e divulgar o patrimônio botânico vivo do nosso campus.',
      aboutBody: 'Cada espécie cadastrada nesta plataforma é parte da história da escola. Ao identificar, fotografar e descrever as plantas que compõem nosso ambiente, buscamos despertar nos estudantes — e na comunidade — a consciência sobre a importância da biodiversidade urbana, da educação ambiental e do cuidado com o espaço comum.',
      aboutObjectives: [
        'Identificar e catalogar todas as espécies vegetais do campus',
        'Documentar com fotografias e descrições detalhadas',
        'Servir como recurso educacional para alunos e professores',
        'Estimular o cuidado e a preservação do verde escolar',
      ],
      aboutContribution: 'Estudantes, professores e pesquisadores interessados em colaborar podem entrar em contato com a coordenação do projeto através da página de equipe.',
      homeHeroBadge: 'Liceu de Messejana',
      homeHeroTitle: 'Herança Verde',
      homeHeroSubtitle: 'Catalogando, preservando e celebrando o patrimônio botânico do nosso campus — uma planta de cada vez.',
      updatedAt: new Date().toISOString(),
    });
  }
}

// ---------------- Auth helpers ----------------
function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
function requireAdmin(request) {
  const payload = getToken(request);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// ---------------- Utils ----------------
function clean(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}
function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Array.from(rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set()));
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v) || typeof v === 'object') v = JSON.stringify(v);
    return `"${String(v).replace(/"/g, '""')}"`;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => escape(r[k])).join(','))].join('\n');
}
function stripImagesForExport(rows) {
  return rows.map((r) => {
    const c = clean(r);
    if (c.images) c.images = `[${(c.images || []).length} imagens]`;
    if (c.photo) c.photo = c.photo ? '[foto]' : '';
    return c;
  });
}

// ---------------- Main handler ----------------
async function handle(request, { params }) {
  let db;
  try {
    db = await getDb();
    await ensureInit(db);
  } catch (err) {
    console.error('DB connection error:', err);
    return NextResponse.json({ error: 'Erro de conexão com o banco de dados' }, { status: 503 });
  }

  const segments = params?.path || [];
  const path = '/' + segments.join('/');
  const method = request.method;

  try {
    // ---------- AUTH ----------
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      const user = await db.collection('users').findOne({ email: (email || '').toLowerCase().trim() });
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
      const items = await db.collection('categories').find({}).sort({ name: 1 }).limit(500).toArray();
      return NextResponse.json(items.map(clean));
    }
    if (path === '/categories' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const { name } = await request.json();
      if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
      if (await db.collection('categories').findOne({ name: name.trim() })) {
        return NextResponse.json({ error: 'Categoria já existe' }, { status: 400 });
      }
      const cat = { id: uuidv4(), name: name.trim(), createdAt: new Date().toISOString() };
      await db.collection('categories').insertOne(cat);
      return NextResponse.json(clean(cat));
    }
    if (path.startsWith('/categories/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const { name } = await request.json();
      const trimmed = (name || '').trim();
      await db.collection('categories').updateOne({ id }, { $set: { name: trimmed } });
      await db.collection('species').updateMany({ categoryId: id }, { $set: { categoryName: trimmed } });
      return NextResponse.json(clean(await db.collection('categories').findOne({ id })));
    }
    if (path.startsWith('/categories/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      await db.collection('categories').deleteOne({ id: segments[1] });
      return NextResponse.json({ ok: true });
    }

    // ---------- SPECIES ----------
    if (path === '/species' && method === 'GET') {
      const url = new URL(request.url);
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const category = url.searchParams.get('category') || '';
      const query = {};
      if (category) query.categoryId = category;
      let items = await db.collection('species').find(query).sort({ createdAt: -1 }).limit(1000).toArray();
      if (search) {
        items = items.filter((s) =>
          (s.scientificName || '').toLowerCase().includes(search) ||
          (s.commonName || '').toLowerCase().includes(search) ||
          (s.family || '').toLowerCase().includes(search)
        );
      }
      return NextResponse.json(items.map(clean));
    }
    if (path === '/species' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const body = await request.json();
      const cat = body.categoryId ? await db.collection('categories').findOne({ id: body.categoryId }) : null;
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
      await db.collection('species').insertOne(doc);
      return NextResponse.json(clean(doc));
    }
    if (path.startsWith('/species/') && method === 'GET') {
      const item = await db.collection('species').findOne({ id: segments[1] });
      if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
      return NextResponse.json(clean(item));
    }
    if (path.startsWith('/species/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const body = await request.json();
      const cat = body.categoryId ? await db.collection('categories').findOne({ id: body.categoryId }) : null;
      const update = {
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
      };
      await db.collection('species').updateOne({ id }, { $set: update });
      return NextResponse.json(clean(await db.collection('species').findOne({ id })));
    }
    if (path.startsWith('/species/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      await db.collection('species').deleteOne({ id: segments[1] });
      return NextResponse.json({ ok: true });
    }

    // ---------- TEAM ----------
    if (path === '/team' && method === 'GET') {
      const items = await db.collection('team').find({}).sort({ order: 1, createdAt: 1 }).limit(500).toArray();
      return NextResponse.json(items.map(clean));
    }
    if (path === '/team' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const body = await request.json();
      const count = await db.collection('team').countDocuments();
      const doc = {
        id: uuidv4(),
        name: body.name || '',
        role: body.role || '',
        description: body.description || '',
        photo: body.photo || '',
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        isMainCreator: !!body.isMainCreator,
        order: typeof body.order === 'number' ? body.order : count,
        createdAt: new Date().toISOString(),
      };
      if (doc.isMainCreator) await db.collection('team').updateMany({}, { $set: { isMainCreator: false } });
      await db.collection('team').insertOne(doc);
      return NextResponse.json(clean(doc));
    }
    if (path.startsWith('/team/') && segments[1] === 'reorder' && method === 'POST') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const { ids } = await request.json();
      if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids array obrigatório' }, { status: 400 });
      if (ids.length > 0) {
        const bulkOps = ids.map((id, i) => ({ updateOne: { filter: { id }, update: { $set: { order: i } } } }));
        await db.collection('team').bulkWrite(bulkOps);
      }
      return NextResponse.json({ ok: true });
    }
    if (path.startsWith('/team/') && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const id = segments[1];
      const body = await request.json();
      if (body.isMainCreator) {
        await db.collection('team').updateMany({ id: { $ne: id } }, { $set: { isMainCreator: false } });
      }
      const update = {
        name: body.name || '',
        role: body.role || '',
        description: body.description || '',
        photo: body.photo || '',
        socialLinks: Array.isArray(body.socialLinks) ? body.socialLinks : [],
        isMainCreator: !!body.isMainCreator,
      };
      if (typeof body.order === 'number') update.order = body.order;
      await db.collection('team').updateOne({ id }, { $set: update });
      return NextResponse.json(clean(await db.collection('team').findOne({ id })));
    }
    if (path.startsWith('/team/') && method === 'DELETE') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      await db.collection('team').deleteOne({ id: segments[1] });
      return NextResponse.json({ ok: true });
    }

    // ---------- SETTINGS ----------
    if (path === '/settings' && method === 'GET') {
      const s = await db.collection('settings').findOne({ id: 'global' });
      return NextResponse.json(clean(s) || {});
    }
    if (path === '/settings' && method === 'PUT') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const body = await request.json();
      const allowed = ['aboutTitle', 'aboutIntro', 'aboutBody', 'aboutObjectives', 'aboutContribution', 'homeHeroBadge', 'homeHeroTitle', 'homeHeroSubtitle'];
      const update = { updatedAt: new Date().toISOString() };
      for (const k of allowed) if (k in body) update[k] = body[k];
      await db.collection('settings').updateOne({ id: 'global' }, { $set: update }, { upsert: true });
      return NextResponse.json(clean(await db.collection('settings').findOne({ id: 'global' })));
    }

    // ---------- EXPORT ----------
    if (path === '/export' && method === 'GET') {
      if (!requireAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const url = new URL(request.url);
      const type = url.searchParams.get('type') || 'species';
      const format = url.searchParams.get('format') || 'json';
      const collection = type === 'team' ? 'team' : type === 'categories' ? 'categories' : 'species';
      const items = await db.collection(collection).find({}).limit(10000).toArray();
      const cleaned = stripImagesForExport(items);
      if (format === 'csv') {
        return new NextResponse(toCSV(cleaned), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${collection}.csv"`,
          },
        });
      }
      return new NextResponse(JSON.stringify(cleaned, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${collection}.json"`,
        },
      });
    }

    // ---------- STATS ----------
    if (path === '/stats' && method === 'GET') {
      const [speciesCount, teamCount, categoriesCount] = await Promise.all([
        db.collection('species').countDocuments(),
        db.collection('team').countDocuments(),
        db.collection('categories').countDocuments(),
      ]);
      return NextResponse.json({ speciesCount, teamCount, categoriesCount });
    }

    if (path === '' || path === '/') {
      return NextResponse.json({ name: 'Herança Verde API', status: 'ok', mode: 'mongodb' });
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