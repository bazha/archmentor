export function PillGroup<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm border transition ${
            o.value === value ? 'bg-accent border-accent text-white' : 'border-surface-muted text-muted hover:border-accent-soft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
