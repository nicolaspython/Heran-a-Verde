'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, ChevronUp, ChevronDown, Star, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { api, getInitials } from '@/lib/api';
import { useAdminData } from '@/context/AdminDataContext';
import ConfirmDelete from '@/components/admin/ConfirmDelete';

function TeamSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-[60px]">
          <div className="flex flex-col gap-1 shrink-0">
            <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-11 w-11 rounded-xl bg-zinc-200 dark:bg-zinc-700 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            <div className="h-3 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamAdmin() {
  const { team: items = [], loading, invalidate } = useAdminData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = { name: '', role: '', description: '', socialLinks: [], isMainCreator: false };
  const [form, setForm] = useState(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...empty, ...m, socialLinks: m.socialLinks || [] }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) await api(`/team/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/team', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Salvo!'); setOpen(false);
      invalidate('team');
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/team/${id}`, { method: 'DELETE' }); invalidate('team'); toast.success('Removido'); }
    catch (e) { toast.error(e.message); }
  };

  const move = async (idx, dir) => {
    const newItems = [...(items || [])];
    const target = idx + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
    invalidate('team');
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

      {loading ? (
        <TeamSkeleton />
      ) : (
        <div className="space-y-2">
          {(items || []).map((m, i) => (
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
          {(items || []).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
              <Users className="h-10 w-10 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm">Nenhum membro cadastrado.</p>
            </div>
          )}
        </div>
      )}

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
