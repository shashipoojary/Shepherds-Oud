type SafeUserRole = "FAMILY" | "PROVIDER" | "ADMIN";

export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: SafeUserRole;
  emailVerified: boolean;
  linkedProviderId?: string | null;
};

type UserLike = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  linkedProviderId?: string | null;
};

function normalizeRole(role: string | null | undefined): SafeUserRole {
  if (role === "ADMIN" || role === "PROVIDER" || role === "FAMILY") {
    return role;
  }
  return "FAMILY";
}

export function toSafeUser(user: UserLike): SafeUser {
  const role = normalizeRole(user.role);

  const safe: SafeUser = {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    image: user.image ?? null,
    role,
    emailVerified: Boolean(user.emailVerified)
  };

  if (role === "PROVIDER" && user.linkedProviderId) {
    safe.linkedProviderId = user.linkedProviderId;
  }

  return safe;
}
