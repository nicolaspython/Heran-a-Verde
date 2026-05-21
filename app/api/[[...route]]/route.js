import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGODB_URI;

if (!MONGO_URL) {
  console.error('❌ MONGODB_URI não definida');
}

const DB_NAME = process.env.DB_NAME || 'heranca_verde';
const JWT_SECRET = process.env.JWT_SECRET || '***REMOVED***';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '***REMOVED***').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '***REMOVED***';

// ---------------- DB ----------------
async function getDb() {
  if (!globalThis.__hv_mongo) {
    const client = new MongoClient(MONGO_URL, { maxPoolSize: 10 });
    await client.connect();
    globalThis.__hv_mongo = client;
  }
  return globalThis.__hv_mongo.db(DB_NAME);
}

// ---------------- INIT ----------------
async function ensureInit(db) {
  if (!globalThis.__hv_init_done) {
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('species').createIndex({ id: 1 }, { unique: true });
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
    const defaults = [
      'Árvore',
      'Arbusto',
      'Herbácea',
      'Medicinal',
      'Frutífera',
      'Ornamental',
      'Palmeira',
    ];

    await db.collection('categories').insertMany(
      defaults.map((name) => ({
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
      }))
    );
  }
}

// ---------------- AUTH ----------------
function getToken(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;

  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req) {
  const payload = getToken(req);
  return payload?.role === 'admin' ? payload : null;
}

// ---------------- CLEAN ----------------
function clean(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

// ---------------- HANDLER ----------------
async function handle(request, { params }) {
  let db;

  try {
    db = await getDb();
    await ensureInit(db);
  } catch (err) {
    return NextResponse.json(
      { error: 'Erro de conexão com o banco' },
      { status: 503 }
    );
  }

  const segments = params?.path || [];
  const path = '/' + (segments.join('/') || '');
  const method = request.method;

  try {

    // ================= AUTH =================

    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json();

      const user = await db.collection('users').findOne({
        email: (email || '').toLowerCase().trim(),
      });

      if (!user) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const ok = await bcrypt.compare(password || '', user.password);

      if (!ok) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    }

    if (path === '/auth/me' && method === 'GET') {
      const payload = getToken(request);

      if (!payload) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }

      return NextResponse.json({ user: payload });
    }

    // ================= SPECIES =================

    if (path === '/species' && method === 'GET') {
      const items = await db.collection('species').find({}).toArray();
      return NextResponse.json(items.map(clean));
    }

    if (path === '/species' && method === 'POST') {
      if (!requireAdmin(request))
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

      const body = await request.json();

      const doc = {
        id: uuidv4(),
        ...body,
        createdAt: new Date().toISOString(),
      };

      await db.collection('species').insertOne(doc);
      return NextResponse.json(clean(doc));
    }

    // ================= CATEGORIES =================

    if (path === '/categories' && method === 'GET') {
      const items = await db.collection('categories').find({}).toArray();
      return NextResponse.json(items.map(clean));
    }

    if (path === '/categories' && method === 'POST') {
      if (!requireAdmin(request))
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

      const { name } = await request.json();

      const cat = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
      };

      await db.collection('categories').insertOne(cat);
      return NextResponse.json(clean(cat));
    }

    // ================= STATS =================

    if (path === '/stats' && method === 'GET') {
      const [speciesCount, teamCount, categoriesCount] = await Promise.all([
        db.collection('species').countDocuments(),
        db.collection('team').countDocuments(),
        db.collection('categories').countDocuments(),
      ]);

      return NextResponse.json({
        speciesCount,
        teamCount,
        categoriesCount,
      });
    }

    // ================= ROOT =================

    if (path === '/' || path === '') {
      return NextResponse.json({
        name: 'Herança Verde API',
        status: 'ok',
        mode: 'mongodb',
      });
    }

    // ================= NOT FOUND =================

    return NextResponse.json(
      { error: 'Not found', path },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;