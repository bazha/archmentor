export function PillGroup<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            o.value === value
              ? 'border-accent bg-accent text-on-accent'
              : 'border-line text-muted hover:border-line-strong hover:text-content'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
