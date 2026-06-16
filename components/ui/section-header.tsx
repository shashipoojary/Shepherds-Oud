export function SectionHeader({ title, description, label }: { title: string; description: string; label?: string }) {
  return (
    <header className="mx-auto mb-9 max-w-2xl text-center">
      {label ? <p className="section-label mb-2">{label}</p> : null}
      <h2 className="font-brand text-h2 font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-body text-ink/80">{description}</p>
    </header>
  );
}
