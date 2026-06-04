'use client';

import { useState, useEffect } from 'react';
import { Users, Star, ExternalLink } from 'lucide-react';
import { api, G, getInitials } from '@/lib/api';

export default function TeamView() {
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
