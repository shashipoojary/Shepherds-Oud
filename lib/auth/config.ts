import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/core/db";
import { isAdminEmail, resolveRole } from "@/lib/auth/roles";
import { sendProviderMagicLinkEmail } from "@/lib/email/provider-magic-link";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-only-better-auth-secret-change-in-production",
  baseURL: appUrl,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  user: {
    additionalFields: {
      role: {
        type: ["FAMILY", "PROVIDER", "ADMIN"],
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
            select: { id: true, email: true, role: true }
          });

          if (!user?.email) {
            return;
          }

          const role = resolveRole(user.email);

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
});
