'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Leaf, Search, Moon, Sun, LogIn, LogOut, Plus, Pencil, Trash2, Star,
  Download, Upload, X, ArrowLeft, MapPin, BookOpen, Users, Image as ImageIcon,
  Settings, Home as HomeIcon, GripVertical, ExternalLink, ChevronUp, ChevronDown
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

// ---------------- API helpers ----------------
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

// ---------------- Theme toggle ----------------
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" />;
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

// ---------------- Navbar ----------------
function Navbar({ view, setView, user, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'catalog', label: 'Catálogo', icon: Leaf },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'about', label: 'Sobre', icon: BookOpen },
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <button onClick={() => setView({ name: 'home' })} className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">Herança Verde</span>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button key={item.id} variant={view.name === item.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setView({ name: item.id })}>
              <item.icon className="h-4 w-4 mr-2" />{item.label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="default" size="sm" onClick={() => setView({ name: 'admin' })}>
                <Settings className="h-4 w-4 mr-2" />Admin
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setView({ name: 'admin-login' })}>
              <LogIn className="h-4 w-4 mr-2" />Entrar
            </Button>
          )}
        </div>
      </div>
      <div className="md:hidden border-t">
        <div className="container flex justify-around py-1">
          {navItems.map((item) => (
            <Button key={item.id} variant={view.name === item.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setView({ name: item.id })}>
              <item.icon className="h-4 w-4" />
              <span className="ml-1 text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ---------------- Home ----------------
function HomeView({ setView }) {
  const [stats, setStats] = useState({ speciesCount: 0, teamCount: 0, categoriesCount: 0 });
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    api('/stats').then(setStats).catch(() => {});
    api('/species').then((items) => setFeatured(items.slice(0, 3))).catch(() => {});
  }, []);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.18), transparent 40%)' }} />
        <div className="container relative py-20 md:py-28 text-center">
          <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <Leaf className="h-3 w-3 mr-1" />Liceu de Messejana
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
            Herança Verde
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">

            Catalogando, preservando e celebrando o patrimônio botânico da nossa escola. Uma planta de cada vez. contato na área de 

          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setView({ name: 'catalog' })}>
              <Search className="h-4 w-4 mr-2" />Explorar Catálogo
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView({ name: 'about' })}>
              Sobre o projeto
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Espécies catalogadas', value: stats.speciesCount, icon: Leaf },
          { label: 'Categorias botânicas', value: stats.categoriesCount, icon: BookOpen },
          { label: 'Membros', value: stats.teamCount, icon: Users },

        ].map((s) => (
          <Card key={s.label} className="border-emerald-100 dark:border-emerald-900/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Espécies em destaque</h2>
            <Button variant="ghost" size="sm" onClick={() => setView({ name: 'catalog' })}>Ver todas →</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((s) => <SpeciesCard key={s.id} species={s} onClick={() => setView({ name: 'species', id: s.id })} />)}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-16 py-8 bg-muted/30">
      <div className="container text-center text-sm text-muted-foreground">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Leaf className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">Herança Verde</span>
        </div>
        <p>Liceu de Messejana — Inventário Botânico do Campus</p>
        <p className="mt-1">© {new Date().getFullYear()} — Todos os direitos reservados</p>
      </div>
    </footer>
  );
}

// ---------------- Species Card ----------------
function SpeciesCard({ species, onClick }) {
  const img = species.images?.[0];
  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-emerald-100 dark:border-emerald-900/40" onClick={onClick}>
      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {img ? (
          <img src={img} alt={species.commonName || species.scientificName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-600/40 dark:text-emerald-400/30">
            <Leaf className="h-16 w-16" />
          </div>
        )}
        {species.categoryName && (
          <Badge className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-600">{species.categoryName}</Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg italic">{species.scientificName || 'Sem nome científico'}</CardTitle>
        {species.commonName && <CardDescription className="font-medium">{species.commonName}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground line-clamp-2">
        {species.description || 'Sem descrição disponível.'}
      </CardContent>
    </Card>
  );
}

// ---------------- Catalog ----------------
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
    api(`/species?${params.toString()}`).then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  }, [search, category]);

  useEffect(() => { api('/categories').then(setCategories).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Catálogo de Espécies</h1>
        <p className="text-muted-foreground mt-1">Explore o inventário botânico do nosso campus</p>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome científico, popular ou família..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-64"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <Leaf className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">Nenhuma espécie encontrada.</p>
            <p className="text-sm text-muted-foreground/70">Adicione espécies pelo painel administrativo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((s) => <SpeciesCard key={s.id} species={s} onClick={() => setView({ name: 'species', id: s.id })} />)}
        </div>
      )}
    </div>
  );
}

// ---------------- Species Detail ----------------
function SpeciesDetailView({ id, setView }) {
  const [species, setSpecies] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => { api(`/species/${id}`).then(setSpecies).catch(() => setSpecies(false)); }, [id]);
  if (species === null) return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;
  if (species === false) return <div className="container py-20 text-center">Espécie não encontrada.</div>;
  const imgs = species.images || [];
  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" onClick={() => setView({ name: 'catalog' })} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar ao catálogo
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
            {imgs[activeImg] ? (
              <img src={imgs[activeImg]} alt={species.commonName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-600/40">
                <Leaf className="h-32 w-32" />
              </div>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {imgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${i === activeImg ? 'border-emerald-600' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {species.categoryName && <Badge className="bg-emerald-600 hover:bg-emerald-600 mb-3">{species.categoryName}</Badge>}
          <h1 className="text-3xl md:text-4xl font-bold italic">{species.scientificName}</h1>
          {species.commonName && <p className="text-xl text-muted-foreground mt-1">{species.commonName}</p>}
          {species.family && <p className="text-sm text-muted-foreground mt-2">Família: <span className="font-medium text-foreground">{species.family}</span></p>}
          <Separator className="my-6" />
          {species.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{species.description}</p>
            </div>
          )}
          {species.characteristics && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Características</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{species.characteristics}</p>
            </div>
          )}
          {species.location && (
            <div className="mb-6 flex items-start gap-2">
              <MapPin className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Localização no campus</h3>
                <p className="text-muted-foreground">{species.location}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Team Public View ----------------
function TeamView() {
  const [team, setTeam] = useState([]);
  useEffect(() => {
  api('/team')
    .then((data) => {
      console.log("TEAM:", data);
      setTeam(data);
    })
    .catch((err) => {
      console.error("ERRO API TEAM:", err);
    });
}, []);
  const main = team.find((m) => m.isMainCreator);
  const others = team.filter((m) => !m.isMainCreator);
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Nossa Equipe</h1>
        <p className="text-muted-foreground mt-2">Pessoas que fazem o Herança Verde acontecer</p>
      </div>
      {team.length === 0 && (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">Equipe ainda não cadastrada.</p>
          </CardContent>
        </Card>
      )}
      {main && (
        <div className="mb-12">
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800 max-w-3xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
            <div className="p-8 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                {getInitials(main.name)}
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-500 mb-2"><Star className="h-3 w-3 mr-1" />Idealizador(a) do Projeto</Badge>
              <h2 className="text-2xl font-bold">{main.name}</h2>
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">{main.role}</p>
              {main.description && <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{main.description}</p>}
              {main.socialLinks?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {main.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />{s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {others.map((m) => (
          <Card key={m.id} className="overflow-hidden border-emerald-100 dark:border-emerald-900/40 text-center">
            <CardHeader>
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow">
                {getInitials(m.name)}
              </div>
              <CardTitle className="text-lg">{m.name}</CardTitle>
              <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium">{m.role}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="line-clamp-3">{m.description}</p>
              {m.socialLinks?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {m.socialLinks.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />{s.label}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- About ----------------
function AboutView() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">Sobre o Projeto</h1>
      <div className="prose prose-emerald dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground leading-relaxed">
          O <strong className="text-foreground">Herança Verde</strong> é uma iniciativa de estudantes do Liceu de Messejana,
          em Fortaleza/CE, dedicada a catalogar, preservar e divulgar o patrimônio botânico vivo da nossa escola.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Cada espécie cadastrada nesta plataforma é parte da história da escola. Ao identificar, fotografar e
          descrever as plantas que compõem nosso ambiente, buscamos despertar nos estudantes — e na comunidade —
          a consciência sobre a importância da biodiversidade urbana, da educação ambiental e do cuidado com
          o espaço comum.
        </p>
        <h2 className="mt-8 text-2xl font-bold">Objetivos</h2>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li> Identificar e catalogar todas as espécies vegetais do campus</li>
          <li> Documentar com fotografias e descrições detalhadas</li>
          <li> Estimular o cuidado e a preservação do verde escolar</li>
        </ul>
        <h2 className="mt-8 text-2xl font-bold">Como contribuir</h2>
        <p className="text-muted-foreground">
          Estudantes, professores e pesquisadores interessados em colaborar podem entrar em contato com a
          coordenação do projeto através da página de equipe.
        </p>
      </div>
    </div>
  );
}

// ---------------- Admin Login ----------------
function AdminLoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
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
  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-2">
            <Leaf className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-center">Painel Administrativo</CardTitle>
          <CardDescription className="text-center">Acesse para gerenciar o Herança Verde</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-xs text-muted-foreground text-center"></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Image input helper ----------------
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
          <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden border">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground">
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Adicionar</span>
          <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handle} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Imagens são armazenadas em base64 no banco.</p>
    </div>
  );
}

// ---------------- Admin Dashboard ----------------
function AdminDashboard({ user, setView }) {
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
      toast.success('Exportado!');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <p className="text-muted-foreground text-sm">Olá, {user?.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportData('species', 'csv')}><Download className="h-4 w-4 mr-2" />Plantas CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportData('species', 'json')}><Download className="h-4 w-4 mr-2" />Plantas JSON</Button>
          <Button variant="outline" size="sm" onClick={() => exportData('team', 'csv')}><Download className="h-4 w-4 mr-2" />Equipe CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-emerald-600">{stats.speciesCount || 0}</p><p className="text-xs text-muted-foreground">Espécies</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-emerald-600">{stats.teamCount || 0}</p><p className="text-xs text-muted-foreground">Equipe</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-3xl font-bold text-emerald-600">{stats.categoriesCount || 0}</p><p className="text-xs text-muted-foreground">Categorias</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="species">Espécies</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="species" className="mt-4"><SpeciesAdmin /></TabsContent>
        <TabsContent value="team" className="mt-4"><TeamAdmin /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoriesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- Species Admin ----------------
function SpeciesAdmin() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const empty = { scientificName: '', commonName: '', family: '', categoryId: '', description: '', characteristics: '', location: '', images: [] };
  const [form, setForm] = useState(empty);

  const load = useCallback(() => api('/species').then(setItems).catch(() => {}), []);
  useEffect(() => { load(); api('/categories').then(setCategories); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s }); setOpen(true); };

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
  const filtered = useMemo(() => items.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.scientificName?.toLowerCase().includes(q) || s.commonName?.toLowerCase().includes(q);
  }), [items, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Nova espécie</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <div className="flex">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900 shrink-0">
                {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Leaf className="h-8 w-8 text-emerald-600/40" /></div>}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <p className="font-semibold italic truncate">{s.scientificName}</p>
                <p className="text-sm text-muted-foreground truncate">{s.commonName}</p>
                {s.categoryName && <Badge variant="outline" className="mt-1 text-xs">{s.categoryName}</Badge>}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                  <ConfirmDelete onConfirm={() => remove(s.id)} label={s.scientificName} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Nenhuma espécie. Clique em &quot;Nova espécie&quot; para adicionar.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar espécie' : 'Nova espécie'}</DialogTitle>
            <DialogDescription>Preencha os dados da planta</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome científico *</Label><Input value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Ex: Mangifera indica" /></div>
              <div><Label>Nome popular</Label><Input value={form.commonName} onChange={(e) => setForm({ ...form, commonName: e.target.value })} placeholder="Ex: Mangueira" /></div>
              <div><Label>Família</Label><Input value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ex: Anacardiaceae" /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Características</Label><Textarea rows={3} value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} placeholder="Altura, folhas, flores..." /></div>
            <div><Label>Localização no campus</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Pátio central, próximo ao bloco A" /></div>
            <div><Label>Imagens</Label><ImagesUploader images={form.images} setImages={(imgs) => setForm({ ...form, images: imgs })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Team Admin ----------------
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
  const remove = async (id) => { try { await api(`/team/${id}`, { method: 'DELETE' }); load(); toast.success('Removido'); } catch (e) { toast.error(e.message); } };

  const move = async (idx, dir) => {
    const newItems = [...items];
    const target = idx + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
    setItems(newItems);
    await api('/team/reorder', { method: 'POST', body: JSON.stringify({ ids: newItems.map((m) => m.id) }) });
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
      <div className="mb-4"><Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Novo membro</Button></div>
      <div className="space-y-2">
        {items.map((m, i) => (
          <Card key={m.id}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)}><ChevronDown className="h-4 w-4" /></Button>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{m.name}</p>
                  {m.isMainCreator && <Badge className="bg-amber-500 hover:bg-amber-500 text-xs"><Star className="h-3 w-3 mr-0.5" />Principal</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{m.role}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
              <ConfirmDelete onConfirm={() => remove(m.id)} label={m.name} />
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center py-12 text-muted-foreground">Nenhum membro cadastrado.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar membro' : 'Novo membro'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Cargo / Função</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
            </div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label className="font-medium">Idealizador(a) principal do projeto</Label>
                <p className="text-xs text-muted-foreground">Apenas um membro pode ser destacado como principal</p>
              </div>
              <Switch checked={form.isMainCreator} onCheckedChange={(v) => setForm({ ...form, isMainCreator: v })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Links sociais (opcional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSocial}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
              </div>
              {(form.socialLinks || []).map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Rótulo (ex: LinkedIn)" value={s.label} onChange={(e) => updateSocial(i, 'label', e.target.value)} className="w-1/3" />
                  <Input placeholder="https://..." value={s.url} onChange={(e) => updateSocial(i, 'url', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Categories Admin ----------------
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
  const remove = async (id) => { try { await api(`/categories/${id}`, { method: 'DELETE' }); load(); toast.success('Removida'); } catch (e) { toast.error(e.message); } };

  return (
    <div className="max-w-xl">
      <div className="flex gap-2 mb-4">
        <Input placeholder="Nova categoria (ex: Cactácea)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
        <Button onClick={create} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        {items.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-2 p-3">
              {editingId === c.id ? (
                <>
                  <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && update(c.id)} autoFocus />
                  <Button size="sm" onClick={() => update(c.id)}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete onConfirm={() => remove(c.id)} label={c.name} />
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------- Confirm delete dialog ----------------
function ConfirmDelete({ onConfirm, label }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>Deseja realmente excluir &quot;{label}&quot;? Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------- Root App ----------------
function App() {
  const [view, setView] = useState({ name: 'home' });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

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

  // Guard admin route
  useEffect(() => {
    if (view.name === 'admin' && authChecked && !user) setView({ name: 'admin-login' });
  }, [view.name, user, authChecked]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar view={view} setView={setView} user={user} onLogout={onLogout} />
      <main className="flex-1">
        {view.name === 'home' && <HomeView setView={setView} />}
        {view.name === 'catalog' && <CatalogView setView={setView} />}
        {view.name === 'species' && <SpeciesDetailView id={view.id} setView={setView} />}
        {view.name === 'team' && <TeamView />}
        {view.name === 'about' && <AboutView />}
        {view.name === 'admin-login' && <AdminLoginView onLogin={(u) => { setUser(u); setView({ name: 'admin' }); }} />}
        {view.name === 'admin' && user && <AdminDashboard user={user} setView={setView} />}
      </main>
    </div>
  );
}

export default App;