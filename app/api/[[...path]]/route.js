import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'heranca_verde';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'HERANCAADMIN').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '***REMOVED***';

// ---------------- MongoDB connection ----------------
async function getDb() {
  if (!globalThis.__hv_mongo) {
    const client = new MongoClient(MONGO_URL, { maxPoolSize: 10 });
    await client.connect();
    globalThis.__hv_mongo = client;
  }
  return globalThis.__hv_mongo.db(DB_NAME);
}

// ---------------- Init ----------------
async function ensureInit(db) {
  if (!globalThis.__hv_init_done) {
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      await db.collection('species').createIndex({ id: 1 }, { unique: true });
      await db.collection('team').createIndex({ id: 1 }, { unique: true });
      await db.collection('categories').createIndex({ id: 1 }, { unique: true });
    } catch {}

    globalThis.__hv_init_done = true;
  }

  // ADMIN USER (USERNAME BASED)
  const adminExists = await db.collection('users').findOne({ username: ADMIN_USERNAME });

  if (!adminExists) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await db.collection('users').insertOne({
      id: uuidv4(),
      username: ADMIN_USERNAME,
      password: hash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
  }
}

// ---------------- AUTH ----------------
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

// ---------------- MAIN ----------------
async function handle(request, { params }) {
  const db = await getDb();
  await ensureInit(db);

  const segments = params?.path || [];
  const path = '/' + segments.join('/');
  const method = request.method;

  try {
    // ---------- LOGIN ----------
    if (path === '/auth/login' && method === 'POST') {
      const { username, password } = await request.json();

      const user = await db.collection('users').findOne({
        username: (username || '').toLowerCase().trim()
      });

      if (!user) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const ok = await bcrypt.compare(password || '', user.password);

      if (!ok) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }

    // ---------- ME ----------
    if (path === '/auth/me' && method === 'GET') {
      const payload = getToken(request);
      if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

      return NextResponse.json({
        user: {
          id: payload.id,
          username: payload.username,
          role: payload.role
        }
      });
    }

    // ---------- TEST ----------
    if (path === '/' || path === '') {
      return NextResponse.json({
        name: 'Herança Verde API',
        status: 'ok',
        auth: 'username-based'
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;