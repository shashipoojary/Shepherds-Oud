import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { getUserRole } from "@/lib/auth-server";
import { actionSchema } from "@/lib/validation/action";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = getUserRole(session);

  if (role !== "ADMIN" && role !== "PROVIDER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    await notifyAction(parsed.data.label);
    return NextResponse.json({ id: `demo-${Date.now()}`, mode: "demo", action: parsed.data }, { status: 201 });
  }

  const { prisma } = await import("@/lib/db");
  const action = await prisma.actionLog.create({
    data: {
      type: parsed.data.type,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      label: parsed.data.label,
      payload: parsed.data.payload ? (parsed.data.payload as Prisma.InputJsonObject) : undefined
    }
  });

  await notifyAction(parsed.data.label);

  return NextResponse.json({ id: action.id, mode: "database" }, { status: 201 });
}

async function notifyAction(label: string) {
  const advisorEmail = process.env.ADVISOR_EMAIL;

  if (!advisorEmail) {
    return;
  }

  await sendBrevoEmail({
    to: [{ email: advisorEmail, name: "Shepherds Oud advisor" }],
    subject: "Shepherds Oud action recorded",
    htmlContent: `<p>${label}</p>`,
    textContent: label
  });
}
