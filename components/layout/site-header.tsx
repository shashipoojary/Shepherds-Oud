import { Nav } from "@/components/layout/nav";

export function SiteHeader({ hideAuth = false }: { hideAuth?: boolean }) {
  return <Nav hideAuth={hideAuth} />;
}
