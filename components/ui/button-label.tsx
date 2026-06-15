export function ButtonLabel({ short, children }: { short: string; children: React.ReactNode }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{children}</span>
    </>
  );
}
