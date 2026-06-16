import { redirect } from "next/navigation";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { postLoginHref } from "@/lib/auth-routes";

export const dynamic = "force-dynamic";

export default async function LoginContinuePage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await getServerSession();
  const { callbackUrl } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const role = getUserRole(session);
  redirect(postLoginHref(role, callbackUrl));
}
