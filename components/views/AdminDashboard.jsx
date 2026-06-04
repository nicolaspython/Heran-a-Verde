'use client';

import { useState, useEffect } from 'react';
import { Download, Leaf, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, G } from '@/lib/api';
import SpeciesAdmin from '@/components/admin/SpeciesAdmin';
import TeamAdmin from '@/components/admin/TeamAdmin';
import CategoriesAdmin from '@/components/admin/CategoriesAdmin';

export default function AdminDashboard({ user }) {
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
