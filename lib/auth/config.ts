import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { nextCookies } from "better-auth/next-js";
import { customSession, magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/core/db";
import { isAdminEmail, resolveRole, resolveRoleForUser } from "@/lib/auth/roles";
import { extractInviteFromRedirectUrl } from "@/lib/auth/login-context";
import { providerLoginErrorMessage } from "@/lib/auth/provider-login-errors";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";
import { PROVIDER_DASHBOARD_PATH, HOSPITAL_DASHBOARD_PATH } from "@/lib/auth/routes";
import { sendFamilyMagicLinkEmail } from "@/lib/email/family-magic-link";
import { sendProviderMagicLinkEmail } from "@/lib/email/provider-magic-link";
import { resolveProviderLoginAccess } from "@/lib/providers/invite-access";
import { resolveHospitalLoginAccess } from "@/lib/hospitals/invite";
import { hospitalLoginErrorFromAccessCode, hospitalLoginErrorMessage } from "@/lib/auth/hospital-login-errors";
import { toSafeSession } from "@/lib/serializers/session";
import { toSafeUser } from "@/lib/serializers/user";
import { syncSessionUser } from "@/lib/auth/sync-session-user";
import { resolveAuthSecret } from "@/lib/config/secrets";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function decodeMagicLinkUrl(url: string) {
  let decoded = url;
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function isFamilyMagicLink(url: string) {
  const decoded = decodeMagicLinkUrl(url);
  return decoded.includes("/family/dashboard") || decoded.includes("/family/login");
}

function isProviderMagicLink(url: string) {
  const decoded = decodeMagicLinkUrl(url);
  return decoded.includes(PROVIDER_DASHBOARD_PATH) || decoded.includes("/provider/login");
}

function isHospitalMagicLink(url: string) {
  const decoded = decodeMagicLinkUrl(url);
  return decoded.includes(HOSPITAL_DASHBOARD_PATH) || decoded.includes("/hospital/login");
}

const authOptions = {
  secret: resolveAuthSecret(),
  baseURL: appUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  user: {
    additionalFields: {
      role: {
        type: ["FAMILY", "PROVIDER", "ADMIN", "HOSPITAL"],
        required: false,
        defaultValue: "FAMILY",
        input: false
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role: resolveRole(user.email)
          }
        })
      }
    },
    session: {
      create: {
        after: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, role: true, linkedProviderId: true, linkedHospitalId: true }
          });

          if (!user?.email) {
            return;
          }

          const role = await resolveRoleForUser(user);

          if (user.role !== role) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role }
            });
          }
        }
      }
    }
  },
  emailAndPassword: {
    enabled: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account"
    }
  },
  trustedOrigins: [appUrl, process.env.NEXT_PUBLIC_APP_URL].filter((value): value is string => Boolean(value)),
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        if (isAdminEmail(email)) {
          throw new Error("Administrator accounts must sign in with Google.");
        }

        if (isFamilyMagicLink(url)) {
          const locale = await getLocale();
          await sendFamilyMagicLinkEmail(email, url, locale);
          return;
        }

        if (isProviderMagicLink(url)) {
          const locale = await getLocale();
          const inviteToken = extractInviteFromRedirectUrl(url);
          const access = await resolveProviderLoginAccess(email, inviteToken);
          if (!access.allowed) {
            throw new Error(
              providerLoginErrorMessage(access.code, locale) ||
                productUi(locale).auth.providerAccountNotFound
            );
          }
          await sendProviderMagicLinkEmail(email, url, locale);
          return;
        }

        if (isHospitalMagicLink(url)) {
          const locale = await getLocale();
          const inviteToken = extractInviteFromRedirectUrl(url);
          const access = await resolveHospitalLoginAccess(email, inviteToken);
          if (!access.allowed) {
            throw new Error(
              hospitalLoginErrorMessage(hospitalLoginErrorFromAccessCode(access.code), locale) ||
                (locale === "en"
                  ? "No hospital account was found for this email."
                  : "Geen ziekenhuisaccount gevonden voor dit e-mailadres.")
            );
          }
          await sendProviderMagicLinkEmail(email, url, locale);
          return;
        }

        await sendProviderMagicLinkEmail(email, url);
      }
    }),
    ...(process.env.BETTER_AUTH_API_KEY
      ? [
          dash({
            apiKey: process.env.BETTER_AUTH_API_KEY
          })
        ]
      : []),
    nextCookies()
  ]
} satisfies BetterAuthOptions;

/**
 * Session response filtering (`customSession` below) applies only to `GET /api/auth/get-session`
 * and therefore `auth.api.getSession()` / `authClient.useSession()`.
 *
 * Better Auth still exposes other sign-in endpoints that can return an unfiltered session
 * `{ token, user, session }` JSON body. Do not point JSON-consuming clients at these paths
 * without adding the same serializers (or switching them to cookie + get-session only).
 *
 * Current app usage (verified):
 * - Magic link send (`login-form.tsx`) always passes `callbackURL`; Better Auth also embeds
 *   `callbackURL` in the emailed verify URL (default `/`), so verify redirects — no JSON body.
 * - Google OAuth (`/login/google`) uses `signInSocial` + redirect; callback sets httpOnly cookie only.
 * - `emailAndPassword.enabled` is false — `signInEmail` is not used.
 *
 * Unfiltered JSON if called directly (e.g. future mobile/API client):
 * - `GET /api/auth/magic-link/verify?token=…` with **no** `callbackURL` query param
 * - `POST /api/auth/sign-in/email` (only if password sign-in is re-enabled)
 *
 * Near-term risk: a native app or SPA that verifies magic links via fetch/XHR without
 * `callbackURL`, or re-enables email/password and reads the sign-in response body.
 */
export const auth = betterAuth({
  ...authOptions,
  plugins: [
    ...(authOptions.plugins ?? []),
    customSession(async ({ user, session }) => {
      const syncedUser = await syncSessionUser(user);
      return {
        user: toSafeUser(syncedUser),
        session: toSafeSession(session)
      };
    }, authOptions)
  ]
});
