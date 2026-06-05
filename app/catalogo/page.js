'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Leaf, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, G, _catalogCache } from '@/lib/api';
import SkeletonCard from '@/components/SkeletonCard';
import SpeciesCard from '@/components/SpeciesCard';

export default function CatalogoPage() {
  const router = useRouter();
  const [items, setItems] = useState(_catalogCache.species || []);
  const [categories, setCategories] = useState(_catalogCache.categories || []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(!_catalogCache.species);

  const load = useCallback(() => {
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

  return (
    <div className={`${G.section} py-12`}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Leaf className="h-3 w-3" />Inventário
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
          <Leaf className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-500">Nenhuma espécie encontrada</p>
          <p className="text-xs text-zinc-400">Tente outros termos ou remova os filtros</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 font-medium">
            {items.length} espécie{items.length !== 1 ? 's' : ''} encontrada{items.length !== 1 ? 's' : ''}
          </p>
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
