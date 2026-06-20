import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { resolveDefaultCareGuideId } from "@/lib/care-guide";
import { normalizeIntakeStatus } from "@/lib/intake-workflow";
import { intakeSchema } from "@/lib/validation/intake";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "intake-create", 8, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await readJsonBody(request);
    const parsed = intakeSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid intake", 400, { issues: parsed.error.flatten() });
    }

    if (!process.env.DATABASE_URL) {
      void runInBackground(
        notifyIntake(parsed.data.contactName, parsed.data.email, "demo-intake", null),
        "intake_confirmation_email"
      );
      return jsonOk({ id: "demo-intake", status: "received", mode: "demo" }, 201);
    }

    const { prisma } = await import("@/lib/db");
    const careGuideId = await resolveDefaultCareGuideId();

    const intake = await prisma.intake.create({
      data: {
        ...parsed.data,
        careGuideId,
        status: careGuideId ? "ASSESSMENT" : "NEW"
      },
      include: {
        careGuide: { select: { name: true, email: true } }
      }
    });

    void runInBackground(
      notifyIntake(parsed.data.contactName, parsed.data.email, intake.id, intake.careGuide),
      "intake_confirmation_email"
    );

    return jsonOk(
      {
        id: intake.id,
        status: normalizeIntakeStatus(intake.status),
        careGuide: intake.careGuide
          ? { name: intake.careGuide.name || "Your Care Guide", email: intake.careGuide.email }
          : null,
        mode: "database"
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "intake_create");
  }
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

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "We received your Shepherds Oud care request",
      htmlContent: `<p>Hello ${name},</p><p>We received your care request. Your reference is <strong>${intakeId}</strong>.</p>${guideLine}<p>No family should navigate elder care alone — we are here to guide you.</p>`,
      textContent: `Hello ${name}, we received your care request. Reference: ${intakeId}.`
    }),
    advisorEmail
      ? sendBrevoEmail({
          to: [{ email: advisorEmail, name: "Shepherds Oud Care Guide team" }],
          subject: `New care intake: ${name}`,
          htmlContent: `<p>A new intake was submitted by ${name}.</p><p>Reference: <strong>${intakeId}</strong></p>`,
          textContent: `A new intake was submitted by ${name}. Reference: ${intakeId}.`
        })
      : Promise.resolve({ mode: "demo" as const, skipped: true })
  ]);
}
