import { Leaf, Star } from 'lucide-react';

export default function SpeciesCard({ species, onClick }) {
  const img = species.images?.[0];
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60">
        {img ? (
          <img
            src={img}
            alt={species.commonName || species.scientificName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-16 w-16 text-emerald-300 dark:text-emerald-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {species.featured && (
            <div className="flex items-center gap-1 bg-amber-400/95 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
              <Star className="h-2.5 w-2.5 fill-white" />
              Destaque
            </div>
          )}
          {species.categoryName && (
            <span className="ml-auto bg-emerald-600/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm">
              {species.categoryName}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        {/* Título Principal: Nome Comum (ou Científico caso não tenha comum) */}
        <p className="font-bold text-zinc-900 dark:text-zinc-50 leading-snug line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {species.commonName || species.scientificName || 'Sem nome'}
        </p>
        
        {/* Subtítulo: Nome Científico (só aparece se houver nome comum para evitar duplicar) */}
        {species.commonName && species.scientificName && (
          <p className="text-sm italic text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium line-clamp-1">
            {species.scientificName}
          </p>
        )}
        
        {species.description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
            {species.description}
          </p>
        )}
      </div>
    </article>
  );
}