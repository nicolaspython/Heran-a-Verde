'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import ConfirmDelete from '@/components/admin/ConfirmDelete';

function CategoriesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-[48px]">
          <div className="flex-1 h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
          <div className="h-7 w-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-7 w-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api('/categories').then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

      {loading ? <CategoriesSkeleton /> : (
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
      )}
    </div>
  );
}
