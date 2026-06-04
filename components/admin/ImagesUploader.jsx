'use client';

import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { fileToBase64, MAX_IMAGE_SIZE_MB } from '@/lib/api';

export default function ImagesUploader({ images, setImages, multiple = true }) {
  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    const arr = [];
    for (const f of files) {
      try { arr.push(await fileToBase64(f)); }
      catch (err) { toast.error(err.message); }
    }
    if (arr.length > 0) setImages(multiple ? [...(images || []), ...arr] : arr.slice(-1));
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(images || []).map((img, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
          <Upload className="h-5 w-5" />
          <span className="text-xs mt-1">Adicionar</span>
          <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handle} />
        </label>
      </div>
      <p className="text-xs text-zinc-400">Máx. {MAX_IMAGE_SIZE_MB}MB por imagem.</p>
    </div>
  );
}
