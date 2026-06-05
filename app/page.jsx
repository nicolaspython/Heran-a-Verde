'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Globe, Droplets, Wind, Leaf, BookOpen, Users, Star } from 'lucide-react';
import { api, G, warmCatalogCache } from '@/lib/api';
import StatCard from '@/components/StatCard';
import SpeciesCard from '@/components/SpeciesCard';
import Footer from '@/components/Footer';

export default function HomePage() {
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
    warmCatalogCache();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className={`${G.section} relative py-24 md:py-36 text-center`}>
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Inventário Botânico · Liceu de Messejana
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none mb-6">
            Herança<br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Verde</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed mb-10">
            Catalogando, preservando e celebrando o patrimônio botânico da nossa escola. Uma planta de cada vez.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => router.push('/catalogo')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]">
              <Search className="h-4 w-4" />Explorar Catálogo
            </button>
            <button onClick={() => router.push('/sobre')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-sm transition-all active:scale-[0.98]">
              Sobre o projeto<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`${G.section} py-12`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Espécies catalogadas" value={stats.speciesCount} icon={Leaf} gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20" />
          <StatCard label="Categorias botânicas" value={stats.categoriesCount} icon={BookOpen} gradient="bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20" />
          <StatCard label="Pesquisadores" value={stats.teamCount} icon={Users} gradient="bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20" />
        </div>
      </section>

      {/* Feature strip */}
      <section className={`${G.section} py-6 mb-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Globe,    title: 'Biodiversidade urbana', desc: 'Mapeando a flora que convive com o dia a dia escolar.' },
            { icon: Droplets, title: 'Conservação ativa',     desc: 'Identificação e monitoramento contínuo das espécies.' },
            { icon: Wind,     title: 'Educação ambiental',    desc: 'Ferramenta pedagógica para professores e estudantes.' },
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

      {/* Featured species */}
      {featured.length > 0 && (
        <section className={`${G.section} py-10`}>
          <div className="flex items-end justify-between mb-7">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />Em destaque
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Espécies em Destaque</h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Selecionadas pela equipe do projeto</p>
            </div>
            <button onClick={() => router.push('/catalogo')} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
              Ver todas <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((s) => (
              <SpeciesCard key={s.id} species={s} onClick={() => router.push(`/especies/${s.id}`)} />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <button onClick={() => router.push('/catalogo')} className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Ver todas as espécies →
            </button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
