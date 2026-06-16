import { cn } from "@/lib/utils";

type MatchScoreProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function scoreTone(score: number) {
  if (score >= 90) {
    return {
      ring: "border-brand-green-light text-brand-green-light",
      bg: "bg-brand-green-light/15"
    };
  }
  if (score >= 70) {
    return {
      ring: "border-brand-amber text-brand-amber",
      bg: "bg-brand-amber/15"
    };
  }
  return {
    ring: "border-brand-beige-dark text-brand-beige-dark",
    bg: "bg-brand-beige-light/40"
  };
}

const sizeClasses = {
  sm: "h-12 w-12 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-16 w-16 text-lg"
};

export function MatchScore({ score, size = "md", className }: MatchScoreProps) {
  const tone = scoreTone(score);

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full border-2 font-semibold",
        sizeClasses[size],
        tone.ring,
        tone.bg,
        className
      )}
      aria-label={`${score} percent match`}
    >
      <div className="text-center leading-none">
        <strong className="block">{score}</strong>
        <span className="text-[10px] font-bold uppercase">match</span>
      </div>
    </div>
  );
}
