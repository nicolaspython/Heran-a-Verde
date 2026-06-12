'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Leaf } from 'lucide-react';
import { api, G } from '@/lib/api';

export default function EspecieDetailPage({ params }) {
  const router = useRouter();
  const [species, setSpecies] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api(`/species/${params.id}`).then(setSpecies).catch(() => setSpecies(false));
  }, [params.id]);

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
      <button onClick={() => router.push('/catalogo')} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-1">
        Voltar ao catálogo
      </button>
    </div>
  );

  const imgs = species.images || [];

  return (
    <div className={`${G.section} py-10`}>
      <button
        onClick={() => router.push('/catalogo')}
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
              <img 
                src={imgs[activeImg]} 
                alt={species.commonName || species.scientificName || "Imagem da espécie"} 
                className="w-full h-full object-cover" 
              />
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
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />Em destaque
              </span>
            )}
          </div>

          {/* Nome Comum ou Científico como destaque principal */}
          <h1
            className={`text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight ${
              !species.commonName ? "italic" : ""
            }`}
          >
            {species.commonName || species.scientificName}
          </h1>

          {/* Nome Científico como subtítulo secundário em itálico */}
          {species.commonName && species.scientificName && (
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mt-2 font-medium italic">
              {species.scientificName}
            </p>
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