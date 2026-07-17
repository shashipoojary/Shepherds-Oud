import { Nav } from "@/components/layout/nav";

type SiteHeaderProps = {
  hideAuth?: boolean;
  variant?: "public" | "admin";
};

export function SiteHeader({ hideAuth = false, variant = "public" }: SiteHeaderProps) {
  return <Nav hideAuth={hideAuth} variant={variant} />;
}
