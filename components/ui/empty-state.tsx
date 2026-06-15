export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-semibold text-neutral-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{description}</p>
    </div>
  );
}
