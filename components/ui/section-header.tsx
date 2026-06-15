export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mx-auto mb-9 max-w-2xl text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-neutral-600">{description}</p>
    </header>
  );
}
