import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { resolveDefaultCareGuideId } from "@/lib/care-guide";
import { intakeSchema } from "@/lib/validation/intake";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = intakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid intake", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    await notifyIntake(parsed.data.contactName, parsed.data.email, "demo-intake", null);
    return NextResponse.json({ id: "demo-intake", status: "received", mode: "demo" }, { status: 201 });
  }

  const { prisma } = await import("@/lib/db");
  const careGuideId = await resolveDefaultCareGuideId();

  const intake = await prisma.intake.create({
    data: {
      ...parsed.data,
      careGuideId
    },
    include: {
      careGuide: { select: { name: true, email: true } }
    }
  });

  await notifyIntake(parsed.data.contactName, parsed.data.email, intake.id, intake.careGuide);

  return NextResponse.json(
    {
      id: intake.id,
      status: intake.status,
      careGuide: intake.careGuide
        ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
        : null,
      mode: "database"
    },
    { status: 201 }
  );
}

async function notifyIntake(
  name: string,
  email: string,
  intakeId: string,
  careGuide: { name: string | null; email: string } | null
) {
  const advisorEmail = process.env.ADVISOR_EMAIL;
  const guideLine = careGuide
    ? `<p>Your Care Guide is <strong>${careGuide.name || "from Shepherds Oud"}</strong> (${careGuide.email}). They will support you through every step.</p>`
    : "<p>A Care Guide will be assigned to support you through every step.</p>";

  await Promise.all([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "We received your Shepherds Oud care request",
      htmlContent: `<p>Hello ${name},</p><p>We received your care request. Your reference is <strong>${intakeId}</strong>.</p>${guideLine}<p>No family should navigate elder care alone — we are here to guide you.</p>`,
      textContent: `Hello ${name}, we received your care request. Reference: ${intakeId}.`
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
