'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Leaf, Moon, Sun, LogIn, LogOut, Settings, Home as HomeIcon,
  MapPin, BookOpen, Users, Star, ArrowLeft, ChevronLeft,
} from 'lucide-react';

// ─── Design tokens (iguais ao page.js principal) ──────────────────────────────
const G = {
  section: 'container mx-auto px-4 sm:px-6',
};

// ─── API helper (sem token — rota pública) ────────────────────────────────────
async function fetchSpecies(id) {
  const res = await fetch(`/api/species/${id}`);
  if (!res.ok) return null;
  return res.json();
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
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

// ─── Navbar simplificada (mesma identidade visual) ────────────────────────────
function Navbar() {
  const router = useRouter();
  const navItems = [
    { id: '/',         label: 'Início',   icon: HomeIcon },
    { id: '/?view=catalog', label: 'Catálogo', icon: Leaf },
    { id: '/?view=team',    label: 'Equipe',   icon: Users },
    { id: '/?view=about',   label: 'Sobre',    icon: BookOpen },
    { id: '/mapa',          label: 'Mapa',     icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
      <div className={`${G.section} flex h-16 items-center justify-between gap-4`}>
        {/* Logo */}
        <button onClick={() => router.push('/')} className="flex items-center gap-3 group shrink-0">
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
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom tabs */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800/60">
        <div className={`${G.section} flex justify-around py-1`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-xs font-medium text-zinc-400 dark:text-zinc-500"
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

// ─── Species Detail View (idêntico ao do page.js, adaptado para esta rota) ───
function SpeciesDetailContent({ species }) {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const imgs = species.images || [];

  return (
    <div className={`${G.section} py-10`}>
      <button
        onClick={() => router.push('/?view=catalog')}
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
              <img src={imgs[activeImg]} alt={species.commonName || species.scientificName} className="w-full h-full object-cover" />
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

          {/* URL compartilhável */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              🔗 Compartilhe:{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs break-all">
                herancaverde.vercel.app/especies/{species.id}
              </span>
            </p>
          </div>
        </div>
      </div>
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

// ─── Page Component ───────────────────────────────────────────────────────────
export default function EspeciePage({ params }) {
  const [species, setSpecies] = useState(null);   // null = carregando, false = erro
  const router = useRouter();

  useEffect(() => {
    if (!params?.id) { setSpecies(false); return; }
    fetchSpecies(params.id)
      .then((data) => setSpecies(data || false))
      .catch(() => setSpecies(false));
  }, [params?.id]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navbar />

      <main className="flex-1 animate-[fadeUp_0.45s_ease_both]">
        {species === null && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-emerald-500 animate-spin" />
            <span className="text-sm">Carregando espécie…</span>
          </div>
        )}

        {species === false && (
          <div className={`${G.section} py-32 text-center`}>
            <Leaf className="h-16 w-16 text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
            <p className="font-bold text-lg text-zinc-500 dark:text-zinc-400">Espécie não encontrada</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 mb-6">
              O ID informado não corresponde a nenhuma espécie cadastrada.
            </p>
            <button
              onClick={() => router.push('/?view=catalog')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Ir para o catálogo
            </button>
          </div>
        )}

        {species && <SpeciesDetailContent species={species} />}
      </main>

      <Footer />
    </div>
  );
}