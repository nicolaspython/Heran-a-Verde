'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Leaf, Search, Moon, Sun, LogIn, LogOut, Plus, Pencil, Trash2, Star,
  Download, Upload, X, ArrowLeft, MapPin, BookOpen, Users,
  Settings, Home as HomeIcon, ExternalLink, ChevronUp, ChevronDown,
  TreePine, Sprout, Wind, Droplets, Globe, ChevronRight, Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

// ─── API ──────────────────────────────────────────────────────────────────────
const api = async (path, options = {}) => {
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

const MAX_IMAGE_SIZE_MB = 2;
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    reject(new Error(`"${file.name}" excede ${MAX_IMAGE_SIZE_MB}MB.`));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  reader.readAsDataURL(file);
});

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = {
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
  pill: 'rounded-full',
  card: 'rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm',
  btn: 'rounded-xl font-medium transition-all active:scale-[0.98]',
  input: 'rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-visible:ring-emerald-500',
  section: 'container mx-auto px-4 sm:px-6',
  fadeUp: 'animate-[fadeUp_0.45s_ease_both]',
};

// ─── Catalog prefetch cache ───────────────────────────────────────────────────
// Busca os dados em background assim que o módulo carrega.
// Quando CatalogView montar, os dados já estão prontos (ou quase).
const _catalogCache = {
  species: null,
  categories: null,
  promise: null,
};
function warmCatalogCache() {
  if (_catalogCache.promise) return;
  _catalogCache.promise = Promise.all([
    api('/species').then((d) => { _catalogCache.species = d; }),
    api('/categories').then((d) => { _catalogCache.categories = d; }),
  ]).catch(() => {});
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full mt-3" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-4/5" />
      </div>
    </div>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Alternar tema"
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4 text-amber-400" />
        : <Moon className="h-4 w-4" />}
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ view, setView, user, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'catalog', label: 'Catálogo', icon: Leaf },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'about', label: 'Sobre', icon: BookOpen },
    { id: 'map', label: 'Mapa', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
      <div className={`${G.section} flex h-16 items-center justify-between gap-4`}>
        {/* Logo */}
        <button onClick={() => setView({ name: 'home' })} className="flex items-center gap-3 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col -gap-0.5">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-none">Herança Verde</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">Liceu de Messejana</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = view.name === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ name: item.id })}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <button
                onClick={() => setView({ name: 'admin' })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button onClick={onLogout} className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setView({ name: 'admin-login' })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800/60">
        <div className={`${G.section} flex justify-around py-1`}>
          {navItems.map((item) => {
            const active = view.name === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ name: item.id })}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-xs font-medium ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

// ─── Species Card ─────────────────────────────────────────────────────────────
function SpeciesCard({ species, onClick, featured = false }) {
  const img = species.images?.[0];
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60">
        {img ? (
          <img
            src={img}
            alt={species.commonName || species.scientificName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-16 w-16 text-emerald-300 dark:text-emerald-700" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {species.featured && (
            <div className="flex items-center gap-1 bg-amber-400/95 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
              <Star className="h-2.5 w-2.5 fill-white" />
              Destaque
            </div>
          )}
          {species.categoryName && (
            <span className={`ml-auto bg-emerald-600/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm`}>
              {species.categoryName}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold italic text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {species.scientificName || 'Sem nome científico'}
        </p>
        {species.commonName && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium line-clamp-1">{species.commonName}</p>
        )}
        {species.description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{species.description}</p>
        )}
      </div>
    </article>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 mt-1.5 tabular-nums">{value}</p>
      </div>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${gradient}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeView({ setView }) {
  const router = useRouter();
  const [stats, setStats] = useState({ speciesCount: 0, teamCount: 0, categoriesCount: 0 });
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api('/stats').then(setStats).catch(() => {});
    api('/species?featured=true')
      .then((items) => {
        if (items.length > 0) setFeatured(items.slice(0, 3));
        else api('/species').then((all) => setFeatured(all.slice(0, 3))).catch(() => {});
      })
      .catch(() => {});
    // Pré-aquece o cache do catálogo em background enquanto o usuário está na home
    warmCatalogCache();
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950" />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className={`${G.section} relative py-24 md:py-36 text-center`}>
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Inventário Botânico · Liceu de Messejana
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none mb-6">
            Herança<br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Verde
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-10">
            Catalogando, preservando e celebrando o patrimônio botânico da nossa escola. Uma planta de cada vez.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setView({ name: 'catalog' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
            >
              <Search className="h-4 w-4" />
              Explorar Catálogo
            </button>
            <button
              onClick={() => setView({ name: 'about' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all active:scale-[0.98]"
            >
              Sobre o projeto
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={`${G.section} py-12`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Espécies catalogadas" value={stats.speciesCount} icon={Leaf} gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20" />
          <StatCard label="Categorias botânicas" value={stats.categoriesCount} icon={BookOpen} gradient="bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20" />
          <StatCard label="Pesquisadores" value={stats.teamCount} icon={Users} gradient="bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20" />
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className={`${G.section} py-6 mb-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Globe, title: 'Biodiversidade urbana', desc: 'Mapeando a flora que convive com o dia a dia escolar.' },
            { icon: Droplets, title: 'Conservação ativa', desc: 'Identificação e monitoramento contínuo das espécies.' },
            { icon: Wind, title: 'Educação ambiental', desc: 'Ferramenta pedagógica para professores e estudantes.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">{f.title}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section className={`${G.section} py-10`}>
          <div className="flex items-end justify-between mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                Em destaque
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Espécies em Destaque</h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Selecionadas pela equipe do projeto</p>
            </div>
            <button
              onClick={() => setView({ name: 'catalog' })}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Ver todas <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((s) => (
              <SpeciesCard key={s.id} species={s} onClick={() => router.push(`/especies/${s.id}`)} />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <button onClick={() => setView({ name: 'catalog' })} className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Ver todas as espécies →
            </button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
      <div className={`${G.section} py-10 flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Herança Verde</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Liceu de Messejana · Fortaleza/CE</p>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">© {new Date().getFullYear()} — Inventário Botânico do Campus</p>
      </div>
    </footer>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
function CatalogView({ setView }) {
  const router = useRouter();
  // Inicia com dados do cache se já disponíveis — zero espera na maioria dos casos
  const [items, setItems] = useState(_catalogCache.species || []);
  const [categories, setCategories] = useState(_catalogCache.categories || []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  // loading só é true se o cache ainda estiver vazio ao montar
  const [loading, setLoading] = useState(!_catalogCache.species);

  const load = useCallback(() => {
    // Se não há filtros ativos e o cache tem dados, usa sem mostrar spinner
    if (!search && category === 'all' && _catalogCache.species) {
      setItems(_catalogCache.species);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    api(`/species?${params.toString()}`)
      .then((d) => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    // Se o cache ainda não chegou, espera a promise e atualiza
    if (!_catalogCache.species) {
      _catalogCache.promise?.then(() => {
        if (_catalogCache.categories) setCategories(_catalogCache.categories);
        if (!search && category === 'all' && _catalogCache.species) {
          setItems(_catalogCache.species);
          setLoading(false);
        }
      });
    } else if (_catalogCache.categories) {
      setCategories(_catalogCache.categories);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  // Skeletons mostrados enquanto carrega pela primeira vez
  const skeletonCount = 8;

  return (
    <div className={`${G.section} py-12`}>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Leaf className="h-3 w-3" />
          Inventário
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Catálogo de Espécies</h1>
        <p className="text-zinc-400 dark:text-zinc-500 mt-1.5 text-sm">Explore o patrimônio botânico do nosso campus</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            placeholder="Buscar por nome científico, popular ou família…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
            <Filter className="h-3.5 w-3.5 mr-2 text-zinc-400" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        // Skeleton grid — a página parece carregada instantaneamente
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
          <Leaf className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-500">Nenhuma espécie encontrada</p>
          <p className="text-xs text-zinc-400">Tente outros termos ou remova os filtros</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 font-medium">{items.length} espécie{items.length !== 1 ? 's' : ''} encontrada{items.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((s) => (
              <SpeciesCard key={s.id} species={s} onClick={() => router.push(`/especies/${s.id}`)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Species Detail ───────────────────────────────────────────────────────────
function SpeciesDetailView({ id, setView }) {
  const [species, setSpecies] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => { api(`/species/${id}`).then(setSpecies).catch(() => setSpecies(false)); }, [id]);

  if (species === null) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
      <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-emerald-500 animate-spin" />
      <span className="text-sm">Carregando…</span>
    </div>
  );
  if (species === false) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
      <Leaf className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
      <p className="font-semibold text-zinc-500">Espécie não encontrada</p>
    </div>
  );

  const imgs = species.images || [];
  return (
    <div className={`${G.section} py-10`}>
      <button
        onClick={() => setView({ name: 'catalog' })}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar ao catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60 shadow-xl shadow-zinc-200/60 dark:shadow-none">
            {imgs[activeImg] ? (
              <img src={imgs[activeImg]} alt={species.commonName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-32 w-32 text-emerald-200 dark:text-emerald-800" />
              </div>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {imgs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    i === activeImg
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {species.categoryName && (
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60">
                {species.categoryName}
              </span>
            )}
            {species.featured && (
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Em destaque
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black italic tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            {species.scientificName}
          </h1>

          {species.commonName && (
            <p className="text-xl text-zinc-400 dark:text-zinc-500 mt-2 font-medium">{species.commonName}</p>
          )}
          {species.family && (
            <p className="mt-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Família: <span className="text-zinc-600 dark:text-zinc-300 normal-case tracking-normal">{species.family}</span>
            </p>
          )}

          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-7" />

          <div className="space-y-6 flex-1">
            {species.description && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Descrição</p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">{species.description}</p>
              </div>
            )}
            {species.characteristics && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Características</p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">{species.characteristics}</p>
              </div>
            )}
            {species.location && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-0.5">Localização no campus</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{species.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Public ──────────────────────────────────────────────────────────────
function TeamView() {
  const [team, setTeam] = useState([]);
  useEffect(() => { api('/team').then(setTeam).catch(() => {}); }, []);
  const main = team.find((m) => m.isMainCreator);
  const others = team.filter((m) => !m.isMainCreator);

  return (
    <div className={`${G.section} py-14`}>
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <Users className="h-3 w-3" />Equipe
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Nossa Equipe</h1>
        <p className="text-zinc-400 dark:text-zinc-500 mt-2 text-sm">Pessoas que fazem o Herança Verde acontecer</p>
      </div>

      {team.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
          <Users className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
          <p className="text-sm">Equipe ainda não cadastrada.</p>
        </div>
      )}

      {/* Main creator */}
      {main && (
        <div className="mb-14 max-w-2xl mx-auto">
          <div className="rounded-3xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/40 p-10 text-center shadow-xl shadow-emerald-500/8">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-emerald-500/30 mb-5">
              {getInitials(main.name)}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              Idealizador(a) do Projeto
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{main.name}</h2>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-1">{main.role}</p>
            {main.description && <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">{main.description}</p>}
            {main.socialLinks?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {main.socialLinks.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <ExternalLink className="h-3 w-3" />{s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {others.map((m) => (
            <div key={m.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-emerald-500/25 mb-4">
                {getInitials(m.name)}
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{m.name}</h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.role}</p>
              {m.description && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 leading-relaxed line-clamp-3">{m.description}</p>}
              {m.socialLinks?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {m.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <ExternalLink className="h-3 w-3" />{s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutView() {
  return (
    <div className={`${G.section} py-14 max-w-2xl`}>
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-5">
        <BookOpen className="h-3 w-3" />Sobre
      </div>
      <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Sobre o Projeto</h1>

      <div className="space-y-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          O <strong className="font-bold text-zinc-900 dark:text-zinc-50">Herança Verde</strong> é uma iniciativa de estudantes
          do Liceu de Messejana, em Fortaleza/CE, dedicada a catalogar, preservar e divulgar o patrimônio botânico vivo da nossa escola.
        </p>
        <p>
          Cada espécie cadastrada nesta plataforma é parte da história da escola. Ao identificar, fotografar e
          descrever as plantas que compõem nosso ambiente, buscamos despertar nos estudantes — e na comunidade —
          a consciência sobre a importância da biodiversidade urbana.
        </p>

        <div className="mt-8 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Objetivos</p>
          <ul className="space-y-3">
            {[
              'Identificar e catalogar todas as espécies vegetais do campus',
              'Documentar com fotografias e descrições detalhadas',
              'Servir como recurso educacional para alunos e professores',
              'Estimular o cuidado e a preservação do verde escolar',
            ].map((obj, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Leaf className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-zinc-600 dark:text-zinc-300">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Como contribuir</p>
          <p>
            Estudantes, professores e pesquisadores interessados em colaborar podem entrar em contato com a
            coordenação do projeto através da página de equipe.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('hv_token', r.token);
      onLogin(r.user);
      toast.success('Bem-vindo(a) de volta!');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Painel Administrativo</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Acesse para gerenciar o Herança Verde</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-7 shadow-xl shadow-zinc-200/60 dark:shadow-none space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            {loading ? (
              <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Entrando…</>
            ) : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Images Uploader ──────────────────────────────────────────────────────────
function ImagesUploader({ images, setImages, multiple = true }) {
  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    const arr = [];
    for (const f of files) {
      try { arr.push(await fileToBase64(f)); }
      catch (err) { toast.error(err.message); }
    }
    if (arr.length > 0) setImages(multiple ? [...(images || []), ...arr] : arr.slice(-1));
    e.target.value = '';
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(images || []).map((img, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Adicionar</span>
          <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handle} />
        </label>
      </div>
      <p className="text-xs text-zinc-400">Máx. {MAX_IMAGE_SIZE_MB}MB por imagem.</p>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const [tab, setTab] = useState('species');
  const [stats, setStats] = useState({});
  useEffect(() => { api('/stats').then(setStats).catch(() => {}); }, [tab]);

  const exportData = async (type, format) => {
    try {
      const token = localStorage.getItem('hv_token');
      const res = await fetch(`/api/export?type=${type}&format=${format}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado com sucesso!');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className={`${G.section} py-10`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Painel Admin</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Logado como <span className="font-semibold text-zinc-600 dark:text-zinc-300">{user?.email}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Plantas CSV', type: 'species', fmt: 'csv' },
            { label: 'Plantas JSON', type: 'species', fmt: 'json' },
            { label: 'Equipe CSV', type: 'team', fmt: 'csv' },
          ].map((e) => (
            <button key={e.label} onClick={() => exportData(e.type, e.fmt)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Download className="h-3.5 w-3.5" />{e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Espécies', val: stats.speciesCount },
          { label: 'Equipe', val: stats.teamCount },
          { label: 'Categorias', val: stats.categoriesCount },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-center">
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{s.val || 0}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 h-auto">
          {[
            { val: 'species', label: 'Espécies', icon: Leaf },
            { val: 'team', label: 'Equipe', icon: Users },
            { val: 'categories', label: 'Categorias', icon: BookOpen },
          ].map((t) => (
            <TabsTrigger key={t.val} value={t.val} className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm flex items-center gap-1.5">
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="species"><SpeciesAdmin /></TabsContent>
        <TabsContent value="team"><TeamAdmin /></TabsContent>
        <TabsContent value="categories"><CategoriesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Species Admin ────────────────────────────────────────────────────────────
function SpeciesAdmin() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const empty = { scientificName: '', commonName: '', family: '', categoryId: '', description: '', characteristics: '', location: '', images: [], featured: false };
  const [form, setForm] = useState(empty);

  const load = useCallback(() => api('/species').then(setItems).catch(() => {}), []);
  useEffect(() => { load(); api('/categories').then(setCategories).catch(() => {}); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) await api(`/species/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/species', { method: 'POST', body: JSON.stringify(form) });
      toast.success(editing ? 'Espécie atualizada!' : 'Espécie criada!');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/species/${id}`, { method: 'DELETE' }); toast.success('Removida'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const toggleFeatured = async (s) => {
    try {
      await api(`/species/${s.id}`, { method: 'PUT', body: JSON.stringify({ featured: !s.featured }) });
      toast.success(s.featured ? 'Removido do destaque' : 'Adicionado ao destaque!');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = useMemo(() => items.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.scientificName?.toLowerCase().includes(q) || s.commonName?.toLowerCase().includes(q);
  }), [items, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            placeholder="Buscar espécie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="h-4 w-4" />Nova espécie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex hover:shadow-md transition-shadow">
            <div className="w-24 shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
              {s.images?.[0]
                ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Leaf className="h-7 w-7 text-zinc-300 dark:text-zinc-600" /></div>
              }
              {s.featured && (
                <div className="absolute top-1.5 left-1.5 bg-amber-400 rounded-full p-0.5 shadow-sm">
                  <Star className="h-2.5 w-2.5 text-white fill-white" />
                </div>
              )}
            </div>
            <div className="flex-1 p-3 min-w-0">
              <p className="font-bold italic text-sm text-zinc-900 dark:text-zinc-50 truncate">{s.scientificName}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{s.commonName}</p>
              {s.categoryName && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                  {s.categoryName}
                </span>
              )}
              <div className="flex gap-0.5 mt-2">
                <button onClick={() => toggleFeatured(s)} title={s.featured ? 'Remover destaque' : 'Destacar'}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${s.featured ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-zinc-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'}`}>
                  <Star className={`h-3.5 w-3.5 ${s.featured ? 'fill-amber-500' : ''}`} />
                </button>
                <button onClick={() => openEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <ConfirmDelete onConfirm={() => remove(s.id)} label={s.scientificName} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl mt-4">
          <Leaf className="h-10 w-10 text-zinc-200 dark:text-zinc-700" />
          <p className="text-sm">Nenhuma espécie. Clique em &quot;Nova espécie&quot; para adicionar.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? 'Editar espécie' : 'Nova espécie'}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">Preencha os dados da planta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nome científico *</Label>
                <Input className="mt-1 rounded-xl" value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Ex: Mangifera indica" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nome popular</Label>
                <Input className="mt-1 rounded-xl" value={form.commonName} onChange={(e) => setForm({ ...form, commonName: e.target.value })} placeholder="Ex: Mangueira" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Família</Label>
                <Input className="mt-1 rounded-xl" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ex: Anacardiaceae" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Categoria</Label>
                <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Descrição</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Características</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} placeholder="Altura, folhas, flores…" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Localização no campus</Label>
              <Input className="mt-1 rounded-xl" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Pátio central, próximo ao bloco A" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20">
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Destacar na página inicial
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Aparece na seção de destaques (máx. 3)</p>
              </div>
              <Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Imagens</Label>
              <div className="mt-2">
                <ImagesUploader images={form.images} setImages={(imgs) => setForm({ ...form, images: imgs })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Team Admin ───────────────────────────────────────────────────────────────
function TeamAdmin() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = { name: '', role: '', description: '', socialLinks: [], isMainCreator: false };
  const [form, setForm] = useState(empty);

  const load = useCallback(() => api('/team').then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...empty, ...m, socialLinks: m.socialLinks || [] }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) await api(`/team/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/team', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Salvo!'); setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/team/${id}`, { method: 'DELETE' }); load(); toast.success('Removido'); }
    catch (e) { toast.error(e.message); }
  };

  const move = async (idx, dir) => {
    const newItems = [...items];
    const target = idx + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
    setItems(newItems);
    await api('/team/reorder', { method: 'POST', body: JSON.stringify({ ids: newItems.map((m) => m.id) }) });
  };

  const addSocial = () => setForm({ ...form, socialLinks: [...(form.socialLinks || []), { label: '', url: '' }] });
  const updateSocial = (i, field, val) => { const l = [...form.socialLinks]; l[i] = { ...l[i], [field]: val }; setForm({ ...form, socialLinks: l }); };
  const removeSocial = (i) => setForm({ ...form, socialLinks: form.socialLinks.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="mb-5">
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="h-4 w-4" />Novo membro
        </button>
      </div>

      <div className="space-y-2">
        {items.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow">
            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => move(i, -1)} className="h-6 w-6 flex items-center justify-center rounded-lg text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(i, 1)} className="h-6 w-6 flex items-center justify-center rounded-lg text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {getInitials(m.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">{m.name}</p>
                {m.isMainCreator && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                    <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />Principal
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{m.role}</p>
            </div>
            <button onClick={() => openEdit(m)} className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <ConfirmDelete onConfirm={() => remove(m.id)} label={m.name} />
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
            <Users className="h-10 w-10 text-zinc-200 dark:text-zinc-700" />
            <p className="text-sm">Nenhum membro cadastrado.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? 'Editar membro' : 'Novo membro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nome *</Label>
                <Input className="mt-1 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Cargo / Função</Label>
                <Input className="mt-1 rounded-xl" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Descrição</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Idealizador(a) principal</p>
                <p className="text-xs text-zinc-400 mt-0.5">Aparece em destaque na página da equipe</p>
              </div>
              <Switch checked={form.isMainCreator} onCheckedChange={(v) => setForm({ ...form, isMainCreator: v })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Links sociais</Label>
                <button onClick={addSocial} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Plus className="h-3 w-3" />Adicionar
                </button>
              </div>
              {(form.socialLinks || []).map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Rótulo (ex: LinkedIn)" value={s.label} onChange={(e) => updateSocial(i, 'label', e.target.value)} className="w-1/3 rounded-xl" />
                  <Input placeholder="https://…" value={s.url} onChange={(e) => updateSocial(i, 'url', e.target.value)} className="rounded-xl" />
                  <button onClick={() => removeSocial(i)} className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button onClick={save} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Categories Admin ─────────────────────────────────────────────────────────
function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const load = useCallback(() => api('/categories').then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    try { await api('/categories', { method: 'POST', body: JSON.stringify({ name }) }); setName(''); load(); toast.success('Categoria criada'); }
    catch (e) { toast.error(e.message); }
  };
  const update = async (id) => {
    try { await api(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: editingName }) }); setEditingId(null); load(); toast.success('Atualizada'); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    try { await api(`/categories/${id}`, { method: 'DELETE' }); load(); toast.success('Removida'); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="max-w-lg">
      <div className="flex gap-2 mb-5">
        <input
          placeholder="Nova categoria (ex: Cactácea)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        <button onClick={create} className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {editingId === c.id ? (
              <>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && update(c.id)}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={() => update(c.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Salvar</button>
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.name}</span>
                <button onClick={() => { setEditingId(c.id); setEditingName(c.name); }} className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <ConfirmDelete onConfirm={() => remove(c.id)} label={c.name} />
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-10 text-sm text-zinc-400">Nenhuma categoria criada ainda.</p>}
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, label }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black">Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente excluir <strong>&quot;{label}&quot;</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-xl bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Map redirect ─────────────────────────────────────────────────────────────
function MapRedirect() {
  useEffect(() => { window.location.href = '/mapa'; }, []);
  return null;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [view, setView] = useState({ name: 'home' });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const v = params.get('view');
  const id = params.get('id');
  if (v === 'species' && id) {
    // Redireciona para a nova URL canônica /especies/:id
    window.location.replace(`/especies/${id}`);
  }
}, []);

  useEffect(() => {
    const token = localStorage.getItem('hv_token');
    if (token) {
      api('/auth/me').then((r) => setUser(r.user)).catch(() => localStorage.removeItem('hv_token')).finally(() => setAuthChecked(true));
    } else setAuthChecked(true);
  }, []);

  const onLogout = () => {
    localStorage.removeItem('hv_token');
    setUser(null);
    setView({ name: 'home' });
    toast.success('Você saiu');
  };

  useEffect(() => {
    if (view.name === 'admin' && authChecked && !user) setView({ name: 'admin-login' });
  }, [view.name, user, authChecked]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Navbar view={view} setView={setView} user={user} onLogout={onLogout} />
      <main className="flex-1">
        {view.name === 'home'        && <HomeView setView={setView} />}
        {view.name === 'catalog'     && <CatalogView setView={setView} />}
        {view.name === 'map'         && <MapRedirect />}
        {view.name === 'species'     && <SpeciesDetailView id={view.id} setView={setView} />}
        {view.name === 'team'        && <TeamView />}
        {view.name === 'about'       && <AboutView />}
        {view.name === 'admin-login' && <AdminLoginView onLogin={(u) => { setUser(u); setView({ name: 'admin' }); }} />}
        {view.name === 'admin'       && user && <AdminDashboard user={user} setView={setView} />}
      </main>
    </div>
  );
}

export default App;