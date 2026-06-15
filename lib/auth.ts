import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function parseEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function resolveRole(email: string | undefined) {
  const normalized = email?.toLowerCase();
  if (!normalized) {
    return "FAMILY";
  }

  if (parseEmailList(process.env.ADMIN_EMAILS).includes(normalized)) {
    return "ADMIN";
  }

  if (parseEmailList(process.env.PROVIDER_EMAILS).includes(normalized)) {
    return "PROVIDER";
  }

  return "FAMILY";
}

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
