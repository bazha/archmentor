export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="text-slate-400">{pct}%</span></div>}
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
           className="h-2 rounded-full bg-surface-muted overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
