'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Pencil, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Leaf } from 'lucide-react';
import { api } from '@/lib/api';
import ConfirmDelete from '@/components/admin/ConfirmDelete';
import ImagesUploader from '@/components/admin/ImagesUploader';

function SpeciesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex h-[88px]">
          <div className="w-24 shrink-0 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          <div className="flex-1 p-3 space-y-2.5">
            <div className="h-3.5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpeciesAdmin() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const empty = { scientificName: '', commonName: '', family: '', categoryId: '', description: '', characteristics: '', location: '', images: [], featured: false };
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      api('/species').then(setItems).catch(() => {}),
      api('/categories').then(setCategories).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) await api(`/species/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/species', { method: 'POST', body: JSON.stringify(form) });
      toast.success(editing ? 'Espécie atualizada!' : 'Espécie criada!');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    try { await api(`/species/${id}`, { method: 'DELETE' }); toast.success('Removida'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const toggleFeatured = async (s) => {
    try {
      await api(`/species/${s.id}`, { method: 'PUT', body: JSON.stringify({ featured: !s.featured }) });
      toast.success(s.featured ? 'Removido do destaque' : 'Adicionado ao destaque!');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = useMemo(() => items.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.scientificName?.toLowerCase().includes(q) || s.commonName?.toLowerCase().includes(q);
  }), [items, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            placeholder="Buscar espécie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm">
          <Plus className="h-4 w-4" />Nova espécie
        </button>
      </div>

      {loading ? <SpeciesSkeleton /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex hover:shadow-md transition-shadow">
                <div className="w-24 shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                  {s.images?.[0]
                    ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Leaf className="h-7 w-7 text-zinc-300 dark:text-zinc-600" /></div>
                  }
                  {s.featured && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-400 rounded-full p-0.5 shadow-sm">
                      <Star className="h-2.5 w-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <p className="font-bold italic text-sm text-zinc-900 dark:text-zinc-50 truncate">{s.scientificName}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{s.commonName}</p>
                  {s.categoryName && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                      {s.categoryName}
                    </span>
                  )}
                  <div className="flex gap-0.5 mt-2">
                    <button onClick={() => toggleFeatured(s)} title={s.featured ? 'Remover destaque' : 'Destacar'}
                      className={`h-7 w-7 flex items-center justify-center rounded-lg transition-colors ${s.featured ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-zinc-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'}`}>
                      <Star className={`h-3.5 w-3.5 ${s.featured ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button onClick={() => openEdit(s)} className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ConfirmDelete onConfirm={() => remove(s.id)} label={s.scientificName} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl mt-4">
              <Leaf className="h-10 w-10 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm">Nenhuma espécie. Clique em &quot;Nova espécie&quot; para adicionar.</p>
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? 'Editar espécie' : 'Nova espécie'}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">Preencha os dados da planta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nome científico *</Label>
                <Input className="mt-1 rounded-xl" value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Ex: Mangifera indica" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nome popular</Label>
                <Input className="mt-1 rounded-xl" value={form.commonName} onChange={(e) => setForm({ ...form, commonName: e.target.value })} placeholder="Ex: Mangueira" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Família</Label>
                <Input className="mt-1 rounded-xl" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ex: Anacardiaceae" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Categoria</Label>
                <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Descrição</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Características</Label>
              <Textarea className="mt-1 rounded-xl" rows={3} value={form.characteristics} onChange={(e) => setForm({ ...form, characteristics: e.target.value })} placeholder="Altura, folhas, flores…" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Localização no campus</Label>
              <Input className="mt-1 rounded-xl" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Pátio central, próximo ao bloco A" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20">
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Destacar na página inicial
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Aparece na seção de destaques (máx. 3)</p>
              </div>
              <Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Imagens</Label>
              <div className="mt-2">
                <ImagesUploader images={form.images} setImages={(imgs) => setForm({ ...form, images: imgs })} />
              </div>
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
