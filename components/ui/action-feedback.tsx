import { cn } from "@/lib/core/utils";

export function ActionFeedback({
  message,
  tone = "success",
  className
}: {
  message: string;
  tone?: "success" | "error" | "info";
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg px-4 py-3 text-sm leading-6",
        tone === "success" && "bg-brand-green-pale/30 text-brand-green-dark",
        tone === "error" && "bg-brand-beige-light/50 text-brand-amber-dark",
        tone === "info" && "bg-brand-cream text-ink/70",
        className
      )}
    >
      {message}
    </div>
  );
}
