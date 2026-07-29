type SafeUserRole = "FAMILY" | "PROVIDER" | "ADMIN" | "HOSPITAL";

export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: SafeUserRole;
  emailVerified: boolean;
  linkedProviderId?: string | null;
  linkedHospitalId?: string | null;
};

type UserLike = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  linkedProviderId?: string | null;
  linkedHospitalId?: string | null;
};

function normalizeRole(role: string | null | undefined): SafeUserRole {
  if (role === "ADMIN" || role === "PROVIDER" || role === "FAMILY" || role === "HOSPITAL") {
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

  if (role === "HOSPITAL" && user.linkedHospitalId) {
    safe.linkedHospitalId = user.linkedHospitalId;
  }

  return safe;
}
