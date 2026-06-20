import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { getUserRole } from "@/lib/auth/server";
import { actionSchema } from "@/lib/validation/action";
import { handleApiError, jsonError, jsonOk, readJsonBody, runInBackground } from "@/lib/core/api-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    const role = getUserRole(session);

    if (role !== "ADMIN" && role !== "PROVIDER") {
      return jsonError("Forbidden", 403);
    }

    const body = await readJsonBody(request, 32_000);
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid action", 400, { issues: parsed.error.flatten() });
    }

    if (!process.env.DATABASE_URL) {
      void runInBackground(notifyAction(parsed.data.label), "action_notification_email");
      return jsonOk({ id: `demo-${Date.now()}`, mode: "demo", action: parsed.data }, 201);
    }

    const { prisma } = await import("@/lib/core/db");
    const action = await prisma.actionLog.create({
      data: {
        type: parsed.data.type,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        label: parsed.data.label,
        payload: parsed.data.payload ? (parsed.data.payload as Prisma.InputJsonObject) : undefined
      }
    });

    void runInBackground(notifyAction(parsed.data.label), "action_notification_email");

    return jsonOk({ id: action.id, mode: "database" }, 201);
  } catch (error) {
    return handleApiError(error, "action_create");
  }
}

async function notifyAction(label: string) {
  const advisorEmail = process.env.ADVISOR_EMAIL;

  if (!advisorEmail) {
    return;
  }

  await sendBrevoEmail({
    to: [{ email: advisorEmail, name: "Shepherds Oud Care Guide team" }],
    subject: "Shepherds Oud action recorded",
    htmlContent: `<p>${label}</p>`,
    textContent: label
  });
}
