"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/auth-server";

function dashboardHref(role: AppRole | undefined) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "PROVIDER") {
    return "/provider";
  }

  return "/family/dashboard";
}

export function AuthUserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const role = session?.user.role as AppRole | undefined;

  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        }
      }
    });
  }

  if (isPending) {
    return <span className="hidden text-sm text-neutral-500 md:inline">Loading...</span>;
  }

  if (!session) {
    return (
      <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link href={dashboardHref(role)} className="max-w-[180px] truncate text-sm text-neutral-600 hover:text-sage-600">
        {session.user.name || session.user.email}
      </Link>
      <Button type="button" size="sm" variant="ghost" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
