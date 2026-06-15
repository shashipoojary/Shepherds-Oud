import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { intakeSchema } from "@/lib/validation/intake";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = intakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid intake", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    await notifyIntake(parsed.data.contactName, parsed.data.email, "demo-intake");
    return NextResponse.json({ id: "demo-intake", status: "received", mode: "demo" }, { status: 201 });
  }

  const { prisma } = await import("@/lib/db");
  const intake = await prisma.intake.create({
    data: parsed.data
  });

  await notifyIntake(parsed.data.contactName, parsed.data.email, intake.id);

  return NextResponse.json({ id: intake.id, status: intake.status, mode: "database" }, { status: 201 });
}

async function notifyIntake(name: string, email: string, intakeId: string) {
  const advisorEmail = process.env.ADVISOR_EMAIL;

  await Promise.all([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "We received your Shepherds Oud care request",
      htmlContent: `<p>Hello ${name},</p><p>We received your care request. Your reference is <strong>${intakeId}</strong>.</p><p>A care advisor will follow up with the next step.</p>`,
      textContent: `Hello ${name}, we received your care request. Your reference is ${intakeId}.`
    }),
    advisorEmail
      ? sendBrevoEmail({
          to: [{ email: advisorEmail, name: "Shepherds Oud advisor" }],
          subject: `New care intake: ${name}`,
          htmlContent: `<p>A new intake was submitted by ${name}.</p><p>Reference: <strong>${intakeId}</strong></p>`,
          textContent: `A new intake was submitted by ${name}. Reference: ${intakeId}.`
        })
      : Promise.resolve({ mode: "demo" as const, skipped: true })
  ]);
}
