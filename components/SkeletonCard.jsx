export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full mt-3" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-4/5" />
      </div>
    </div>
  );
}
