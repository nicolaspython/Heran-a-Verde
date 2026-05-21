'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Leaf, Search, Moon, Sun, LogIn, LogOut, Plus, Pencil, Trash2, Star,
  Download, Upload, X, ArrowLeft, MapPin, BookOpen, Users, Image as ImageIcon,
  Settings, Home as HomeIcon, GripVertical, ExternalLink, ChevronUp, ChevronDown,
  TreePine, Sprout, FlowerIcon,
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

// ─── API helpers ──────────────────────────────────────────────────────────────
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

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" />;
  return (
    <Button
      variant="ghost" size="icon"
      className="w-9 h-9 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Alternar tema"
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4 text-amber-400" />
        : <Moon className="h-4 w-4 text-slate-500" />}
    </Button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ view, setView, user, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'catalog', label: 'Catálogo', icon: Leaf },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'about', label: 'Sobre', icon: BookOpen },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100/80 dark:border-emerald-900/30 bg-white/90 dark:bg-background/90 backdrop-blur-md shadow-sm shadow-emerald-50 dark:shadow-none">
      <div className="container flex h-16 items-center justify-between gap-4">
        <button
          onClick={() => setView({ name: 'home' })}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/50 transition-transform group-hover:scale-105">
            <Leaf className="h-4.5 w-4.5" />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="font-bold text-base text-emerald-800 dark:text-emerald-300 tracking-tight">Herança Verde</span>
            <span className="block text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-normal -mt-0.5">Liceu de Messejana</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView({ name: item.id })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view.name === item.id
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          {user ? (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm"
                onClick={() => setView({ name: 'admin' })}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />Admin
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={onLogout} aria-label="Sair">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => setView({ name: 'admin-login' })}
            >
              <LogIn className="h-3.5 w-3.5 mr-1.5" />Entrar
            </Button>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-emerald-100/80 dark:border-emerald-900/30 bg-white/80 dark:bg-background/80">
        <div className="container flex justify-around py-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView({ name: item.id })}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
                view.name === item.id
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ─── Featured Section ─────────────────────────────────────────────────────────
function FeaturedSection({ setView }) {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/species?featured=true')
      .then((items) => { setFeatured(items.slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || featured.length === 0) return null;

  return (
    <section className="container pb-16">
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-amber-200 dark:border-amber-700/50">
            <Star className="h-3 w-3" />Em destaque
          </div>
          <h2 className="text-2xl font-bold text-foreground">Espécies em Destaque</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Selecionadas pela equipe do Herança Verde</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 rounded-full"
          onClick={() => setView({ name: 'catalog' })}
        >
          Ver todas →
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {featured.map((s) => (
          <div key={s.id} className="relative">
            <div className="absolute -top-2 -right-2 z-10 bg-amber-400 text-white rounded-full p-1 shadow-md">
              <Star className="h-3.5 w-3.5 fill-white" />
            </div>
            <SpeciesCard species={s} onClick={() => setView({ name: 'species', id: s.id })} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeView({ setView }) {
  const [stats, setStats] = useState({ speciesCount: 0, teamCount: 0, categoriesCount: 0 });

  useEffect(() => {
    api('/stats').then(setStats).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/60 dark:via-background dark:to-teal-950/40" />
        <div className="absolute inset-0 hero-texture" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl" />

        <div className="container relative py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-emerald-200 dark:border-emerald-700/50 shadow-sm">
            <Sprout className="h-3 w-3" />
            Liceu de Messejana · Fortaleza/CE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100 mb-4">
            Herança{' '}
            <span className="italic bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Verde</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            Catalogando, preservando e celebrando o patrimônio botânico do nosso campus — uma planta de cada vez.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 font-semibold px-7"
              onClick={() => setView({ name: 'catalog' })}
            >
              <Search className="h-4 w-4 mr-2" />Explorar Catálogo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-7"
              onClick={() => setView({ name: 'about' })}
            >
              Sobre o projeto
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {[
            { label: 'Espécies catalogadas', value: stats.speciesCount, icon: Leaf, color: 'from-emerald-500 to-teal-500' },
            { label: 'Categorias botânicas', value: stats.categoriesCount, icon: BookOpen, color: 'from-teal-500 to-cyan-500' },
            { label: 'Pesquisadores', value: stats.teamCount, icon: Users, color: 'from-green-500 to-emerald-500' },
          ].map((s) => (
            <Card key={s.label} className="border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-card overflow-hidden hover:shadow-md hover:shadow-emerald-100 dark:hover:shadow-emerald-900/30 transition-shadow">
              <CardContent className="pt-6 pb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-4xl font-bold mt-1 text-foreground">{s.value}</p>
                </div>
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md shrink-0`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured species */}
      <FeaturedSection setView={setView} />

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-emerald-100 dark:border-emerald-900/30 mt-8 py-10 bg-emerald-50/50 dark:bg-emerald-950/20">
      <div className="container text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Leaf className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-emerald-800 dark:text-emerald-300">Herança Verde</span>
        </div>
        <p className="text-sm text-muted-foreground">Liceu de Messejana · Inventário Botânico do Campus</p>
        <p className="mt-1 text-xs text-muted-foreground/60">© {new Date().getFullYear()} — Todos os direitos reservados</p>
      </div>
    </footer>
  );
}

// ─── Species Card ─────────────────────────────────────────────────────────────
function SpeciesCard({ species, onClick }) {
  const img = species.images?.[0];
  return (
    <Card
      className="overflow-hidden cursor-pointer leaf-card border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-card"
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={species.commonName || species.scientificName}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-14 w-14 text-emerald-300 dark:text-emerald-700" />
          </div>
        )}
        {species.categoryName && (
          <Badge className="absolute top-2.5 right-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white backdrop-blur-sm text-xs shadow-sm">
            {species.categoryName}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base italic text-emerald-900 dark:text-emerald-100 leading-snug">
          {species.scientificName || 'Sem nome científico'}
        </CardTitle>
        {species.commonName && (
          <CardDescription className="font-medium text-foreground/80 not-italic">
            {species.commonName}
          </CardDescription>
        )}
      </CardHeader>
      {species.description && (
        <CardContent className="pt-0 pb-4 text-sm text-muted-foreground line-clamp-2">
          {species.description}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
function CatalogView({ setView }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
api(`/species?${params.toString()}`)
  .then((data) => {
    console.log('Species:', data);

    if (Array.isArray(data)) {
      setItems(Array.isArray(data) ? data : data.items || []);
    } else if (Array.isArray(data.species)) {
      setItems(data.species);
    } else {
      setItems([]);
    }

    setLoading(false);
  })
  .catch(() => {
    setItems([]);
    setLoading(false);
  });
  }, [search, category]);

useEffect(() => {
  api('/categories')
    .then((data) => {
      console.log('Categorias:', data);

      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    })
    .catch(() => setCategories([]));
}, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div className="container py-10 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Catálogo de Espécies</h1>
        <p className="text-muted-foreground mt-1">Explore o inventário botânico do nosso campus</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome científico, popular ou família…"
            className="pl-9 bg-white dark:bg-card border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56 bg-white dark:bg-card border-emerald-200 dark:border-emerald-800 rounded-xl">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Array.isArray(categories) &&
  categories.map((c) => (
    <SelectItem key={c.id} value={c.id}>
      {c.name}
    </SelectItem>
  ))
}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="inline-block w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mb-3" />
          <p>Carregando…</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-20 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CardContent>
            <Leaf className="h-14 w-14 mx-auto text-emerald-300 dark:text-emerald-700 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma espécie encontrada.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Tente outros termos ou categorias.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
          {Array.isArray(items) &&
  Array.isArray(items) && items.map((s) => (
            <SpeciesCard key={s.id} species={s} onClick={() => setView({ name: 'species', id: s.id })} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Species Detail ───────────────────────────────────────────────────────────
function SpeciesDetailView({ id, setView }) {
  const [species, setSpecies] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => {
    api(`/species/${id}`).then(setSpecies).catch(() => setSpecies(false));
  }, [id]);

  if (species === null) return (
    <div className="container py-20 text-center text-muted-foreground">
      <div className="inline-block w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mb-3" />
      <p>Carregando…</p>
    </div>
  );
  if (species === false) return (
    <div className="container py-20 text-center">
      <Leaf className="h-14 w-14 mx-auto text-emerald-200 dark:text-emerald-800 mb-4" />
      <p className="text-muted-foreground">Espécie não encontrada.</p>
    </div>
  );

  const imgs = species.images || [];
  return (
    <div className="container py-10 animate-fade-in-up">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView({ name: 'catalog' })}
        className="mb-6 text-muted-foreground hover:text-foreground rounded-full"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />Voltar ao catálogo
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
            {imgs[activeImg] ? (
              <img src={imgs[activeImg]} alt={species.commonName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-24 w-24 text-emerald-300 dark:text-emerald-700" />
              </div>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {imgs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activeImg
                      ? 'border-emerald-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {species.categoryName && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white mb-4">{species.categoryName}</Badge>
          )}
          <h1 className="text-4xl font-bold italic text-emerald-900 dark:text-emerald-100 leading-tight">
            {species.scientificName}
          </h1>
          {species.commonName && (
            <p className="text-xl text-muted-foreground mt-2 font-medium">{species.commonName}</p>
          )}
          {species.family && (
            <p className="text-sm text-muted-foreground mt-2">
              Família: <span className="font-semibold text-foreground">{species.family}</span>
            </p>
          )}

          <Separator className="my-7 border-emerald-100 dark:border-emerald-900/40" />

          <div className="space-y-6">
            {species.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{species.description}</p>
              </div>
            )}
            {species.characteristics && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Características</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{species.characteristics}</p>
              </div>
            )}
            {species.location && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <MapPin className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5">Localização no campus</h3>
                  <p className="text-muted-foreground text-sm">{species.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────
function TeamView() {
  const [team, setTeam] = useState([]);
  useEffect(() => {
  api('/team')
    .then((data) => {
      console.log('Team:', data);

      if (Array.isArray(data)) {
        setTeam(data);
      } else if (Array.isArray(data.team)) {
        setTeam(data.team);
      } else {
        setTeam([]);
      }
    })
    .catch(() => setTeam([]));
}, []);
  const main = Array.isArray(team)
  ? team.find((m) => m.isMainCreator)
  : null;

const others = Array.isArray(team)
  ? team.filter((m) => !m.isMainCreator)
  : [];
  return (
    <div className="container py-14 animate-fade-in-up">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-emerald-200 dark:border-emerald-700/50">
          <Users className="h-3 w-3" />Equipe
        </div>
        <h1 className="text-4xl font-bold text-foreground">Nossa Equipe</h1>
        <p className="text-muted-foreground mt-2">Pessoas que fazem o Herança Verde acontecer</p>
      </div>

      {team.length === 0 && (
        <Card className="text-center py-20 border-dashed border-emerald-200 dark:border-emerald-800">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-emerald-300 dark:text-emerald-700 mb-4" />
            <p className="text-muted-foreground">Equipe ainda não cadastrada.</p>
          </CardContent>
        </Card>
      )}

      {main && (
        <div className="mb-14 max-w-2xl mx-auto">
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/40 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30">
            <div className="p-10 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/50">
                {getInitials(main.name)}
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white mb-3 shadow-sm">
                <Star className="h-3 w-3 mr-1" />Idealizador(a) do Projeto
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">{main.name}</h2>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">{main.role}</p>
              {main.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-md mx-auto">{main.description}</p>
              )}
              {main.socialLinks?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {main.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 bg-white dark:bg-card/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                      <ExternalLink className="h-3 w-3" />{s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {others.map((m) => (
            <Card key={m.id} className="overflow-hidden border-emerald-100 dark:border-emerald-900/40 text-center hover:shadow-md transition-shadow">
              <CardHeader className="pt-8 pb-3">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
                  {getInitials(m.name)}
                </div>
                <CardTitle className="text-lg">{m.name}</CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-400 font-semibold">{m.role}</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                {m.description && <p className="text-sm text-muted-foreground line-clamp-3">{m.description}</p>}
                {m.socialLinks?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                    {m.socialLinks.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                        <ExternalLink className="h-2.5 w-2.5" />{s.label}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutView() {
  return (
    <div className="container py-14 max-w-2xl animate-fade-in-up">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-5 border border-emerald-200 dark:border-emerald-700/50">
          <BookOpen className="h-3 w-3" />Sobre
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Sobre o Projeto</h1>
      </div>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p className="text-lg">
          O <strong className="text-foreground font-semibold">Herança Verde</strong> é uma iniciativa do Liceu de Messejana,
          em Fortaleza/CE, dedicada a catalogar, preservar e divulgar o patrimônio botânico vivo do nosso campus.
        </p>
        <p>
          Cada espécie cadastrada nesta plataforma é parte da história da escola. Ao identificar, fotografar e
          descrever as plantas que compõem nosso ambiente, buscamos despertar nos estudantes — e na comunidade —
          a consciência sobre a importância da biodiversidade urbana, da educação ambiental e do cuidado com
          o espaço comum.
        </p>

        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TreePine className="h-5 w-5 text-emerald-600" />Objetivos
          </h2>
          <ul className="space-y-2.5">
            {[
              'Identificar e catalogar todas as espécies vegetais do campus',
              'Documentar com fotografias e descrições detalhadas',
              'Servir como recurso educacional para alunos e professores',
              'Estimular o cuidado e a preservação do verde escolar',
            ].map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Leaf className="h-2.5 w-2.5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Como contribuir</h2>
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
  const [email, setEmail] = useState('***REMOVED***');
  const [password, setPassword] = useState('***REMOVED***');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const r = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('hv_token', r.token);

    onLogin(r.user || r);

    toast.success('Bem-vindo(a)!');

  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container py-20 max-w-sm animate-fade-in-up">
      <Card className="border-emerald-100 dark:border-emerald-900/40 shadow-xl shadow-emerald-100/50 dark:shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl">Painel Administrativo</CardTitle>
          <CardDescription>Acesse para gerenciar o Herança Verde</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 rounded-xl"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Senha</Label>
              <Input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 rounded-xl"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-200 dark:shadow-none font-semibold"
              disabled={loading}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Entrando…</>
              ) : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────
function ImagesUploader({ images, setImages, multiple = true }) {
  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    const arr = [];
    for (const f of files) {
      try { arr.push(await fileToBase64(f)); } catch {}
    }
    setImages(multiple ? [...(images || []), ...arr] : arr.slice(-1));
    e.target.value = '';
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(images || []).map((img, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-muted-foreground transition-colors">
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Adicionar</span>
          <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handle} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Imagens são armazenadas em base64 no banco.</p>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ user, setView }) {
  const [tab, setTab] = useState('species');
  const [stats, setStats] = useState({});
  useEffect(() => { api('/stats').then(setStats).catch(() => {}); }, [tab]);

  const exportData = async (type, format) => {
    try {
      const token = localStorage.getItem('hv_token');
      const res = await fetch(`/api/export?type=${type}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado!');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="container py-10 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Olá, <span className="font-medium">{user?.email}</span></p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-full border-emerald-200 dark:border-emerald-800" onClick={() => exportData('species', 'csv')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Plantas CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-full border-emerald-200 dark:border-emerald-800" onClick={() => exportData('species', 'json')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Plantas JSON
          </Button>
          <Button variant="outline" size="sm" className="rounded-full border-emerald-200 dark:border-emerald-800" onClick={() => exportData('team', 'csv')}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Equipe CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Espécies', value: stats.speciesCount || 0 },
          { label: 'Equipe', value: stats.teamCount || 0 },
          { label: 'Categorias', value: stats.categoriesCount || 0 },
        ].map((s) => (
          <Card key={s.label} className="border-emerald-100 dark:border-emerald-900/40">
            <CardContent className="pt-5 text-center">
              <p className="text-3xl font-bold text-emerald-600">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-1 mb-6">
          <TabsTrigger value="species" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Leaf className="h-3.5 w-3.5 mr-1.5" />Espécies
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5 mr-1.5" />Equipe
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />Categorias
          </TabsTrigger>
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
  useEffect(() => { load(); api('/categories').then(setCategories); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s, featured: !!s.featured }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        await api(`/species/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Espécie atualizada');
      } else {
        await api('/species', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Espécie criada');
      }
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/species/${id}`, { method: 'DELETE' }); toast.success('Removida'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const filtered = useMemo(() => {
  if (!Array.isArray(items)) return [];

  return items.filter((s) => {
    const q = search.toLowerCase();

    return (
      !q ||
      s.scientificName?.toLowerCase().includes(q) ||
      s.commonName?.toLowerCase().includes(q)
    );
  });
}, [items, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <Input
          placeholder="Buscar espécie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-emerald-200 dark:border-emerald-800 rounded-xl"
        />
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Nova espécie
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <Card key={s.id} className="border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
            <div className="flex">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-950 shrink-0 relative">
                {s.images?.[0]
                  ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Leaf className="h-7 w-7 text-emerald-400" /></div>
                }
                {s.featured && (
                  <div className="absolute top-1 right-1 bg-amber-400 text-white rounded-full p-0.5">
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <p className="font-semibold italic truncate text-sm text-emerald-900 dark:text-emerald-100">{s.scientificName}</p>
                <p className="text-xs text-muted-foreground truncate">{s.commonName}</p>
                {s.categoryName && <Badge variant="outline" className="mt-1 text-xs border-emerald-200 dark:border-emerald-800">{s.categoryName}</Badge>}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(s)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ConfirmDelete onConfirm={() => remove(s.id)} label={s.scientificName} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Leaf className="h-10 w-10 mx-auto text-emerald-200 dark:text-emerald-800 mb-3" />
          <p>Nenhuma espécie. Clique em "Nova espécie" para adicionar.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar espécie' : 'Nova espécie'}</DialogTitle>
            <DialogDescription>Preencha os dados da planta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nome científico *</Label>
                <Input className="mt-1 rounded-xl" value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Ex: Mangifera indica" />
              </div>
              <div>
                <Label>Nome popular</Label>
                <Input className="mt-1 rounded-xl" value={form.commonName} onChange={(e) => setForm({ ...form, commonName: e.target.value })} placeholder="Ex: Mangueira" />
              </div>
              <div>
                <Label>Família</Label>
                <Input className="mt-1 rounded-xl" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ex: Anacardiaceae" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {Array.isArray(categories) &&
  categories.map((c) => (
    <SelectItem key={c.id} value={c.id}>
      {c.name}
    </SelectItem>
  ))
}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Características</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} placeholder="Altura, folhas, flores…" />
            </div>
            <div>
              <Label>Localização no campus</Label>
              <Input className="mt-1 rounded-xl" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Pátio central, próximo ao bloco A" />
            </div>
            <div>
              <Label>Imagens</Label>
              <div className="mt-1">
                <ImagesUploader images={form.images} setImages={(imgs) => setForm({ ...form, images: imgs })} />
              </div>
            </div>

            {/* Toggle destaque */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-xl">
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Espécie em destaque
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Aparece na seção de destaque da página inicial (máx. 3)</p>
              </div>
              <Switch
                checked={!!form.featured}
                onCheckedChange={(v) => setForm({ ...form, featured: v })}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={save}>Salvar</Button>
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
      toast.success('Salvo'); setOpen(false); load();
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
    await api('/team/reorder', { method: 'POST', body: JSON.stringify({ ids: newArray.isArray(items) && items.map((m) => m.id) }) });
  };

  const addSocial = () => setForm({ ...form, socialLinks: [...(form.socialLinks || []), { label: '', url: '' }] });
  const updateSocial = (i, field, val) => {
    const links = [...form.socialLinks];
    links[i] = { ...links[i], [field]: val };
    setForm({ ...form, socialLinks: links });
  };
  const removeSocial = (i) => setForm({ ...form, socialLinks: form.socialLinks.filter((_, idx) => idx !== i) });

  return (
    <div>
      <div className="mb-5">
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" />Novo membro
        </Button>
      </div>
      <div className="space-y-2">
        {Array.isArray(items) &&
  Array.isArray(items) && items.map((m, i) => (
          <Card key={m.id} className="border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={() => move(i, -1)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-lg" onClick={() => move(i, 1)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm">{m.name}</p>
                  {m.isMainCreator && (
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs shrink-0">
                      <Star className="h-2.5 w-2.5 mr-0.5" />Principal
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.role}</p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => openEdit(m)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDelete onConfirm={() => remove(m.id)} label={m.name} />
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto text-emerald-200 dark:text-emerald-800 mb-3" />
            <p>Nenhum membro cadastrado.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar membro' : 'Novo membro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input className="mt-1 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Cargo / Função</Label>
                <Input className="mt-1 rounded-xl" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
              <div>
                <p className="font-medium text-sm">Idealizador(a) principal do projeto</p>
                <p className="text-xs text-muted-foreground mt-0.5">Apenas um membro pode ser destacado como principal</p>
              </div>
              <Switch checked={form.isMainCreator} onCheckedChange={(v) => setForm({ ...form, isMainCreator: v })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Links sociais (opcional)</Label>
                <Button type="button" variant="outline" size="sm" className="rounded-lg h-7 text-xs" onClick={addSocial}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar
                </Button>
              </div>
              {(form.socialLinks || []).map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Rótulo (ex: LinkedIn)" value={s.label} onChange={(e) => updateSocial(i, 'label', e.target.value)} className="w-1/3 rounded-xl" />
                  <Input placeholder="https://…" value={s.url} onChange={(e) => updateSocial(i, 'url', e.target.value)} className="rounded-xl" />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-lg" onClick={() => removeSocial(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={save}>Salvar</Button>
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
        <Input
          placeholder="Nova categoria (ex: Cactácea)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          className="rounded-xl border-emerald-200 dark:border-emerald-800"
        />
        <Button onClick={create} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {Array.isArray(items) && items.map((c) => (
          <Card key={c.id} className="border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-2 p-3">
              {editingId === c.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && update(c.id)}
                    autoFocus
                    className="rounded-xl"
                  />
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0" onClick={() => update(c.id)}>Salvar</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg shrink-0" onClick={() => setEditingId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-sm">{c.name}</span>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDelete onConfirm={() => remove(c.id)} label={c.name} />
                </>
              )}
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhuma categoria criada ainda.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, label }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente excluir &quot;{label}&quot;? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 rounded-xl">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  const [view, setView] = useState({ name: 'home' });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('hv_token');

    if (token) {
      api('/auth/me')
        .then((r) => {
          setUser(r.user);
        })
        .catch(() => {
          localStorage.removeItem('hv_token');
        })
        .finally(() => {
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const onLogout = () => {
    localStorage.removeItem('hv_token');
    setUser(null);
    setView({ name: 'home' });
    toast.success('Você saiu');
  };

  useEffect(() => {
    if (view.name === 'admin' && authChecked && !user) {
      setView({ name: 'admin-login' });
    }
  }, [view.name, user, authChecked]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        view={view}
        setView={setView}
        user={user}
        onLogout={onLogout}
      />

      <main className="flex-1">
        {view.name === 'home' && (
          <HomeView setView={setView} />
        )}

        {view.name === 'catalog' && (
          <CatalogView setView={setView} />
        )}

        {view.name === 'species' && (
          <SpeciesDetailView
            id={view.id}
            setView={setView}
          />
        )}

        {view.name === 'team' && (
          <TeamView />
        )}

        {view.name === 'about' && (
          <AboutView />
        )}

        {view.name === 'admin-login' && (
          <AdminLoginView
            onLogin={(u) => {
              setUser(u);
              setView({ name: 'admin' });
            }}
          />
        )}

        {view.name === 'admin' && (
          user ? (
            <AdminDashboard
              user={user}
              setView={setView}
            />
          ) : (
            <div className="container py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mb-3" />
              <p>Carregando painel...</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;