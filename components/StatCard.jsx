export default function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-zinc-900 dark:text-zinc-50 mt-1.5 tabular-nums">{value}</p>
      </div>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${gradient}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}
