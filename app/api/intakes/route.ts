import { sendBrevoEmail } from "@/lib/email/brevo";
import { ubuntuTagline } from "@/lib/content";
import { isPrelaunch } from "@/lib/prelaunch";
import { resolveDefaultCareGuideId } from "@/lib/care-guide";
import { normalizeIntakeStatus } from "@/lib/intake-workflow";
import { intakeSchema } from "@/lib/validation/intake";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/api-helpers";

export const runtime = "nodejs";

function parseDischargeDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function intakeCreateData(data: ReturnType<typeof intakeSchema.parse>) {
  const { hospitalDischargeDate, ...rest } = data;
  return {
    ...rest,
    hospitalDischargeDate: parseDischargeDate(hospitalDischargeDate)
  };
}

export async function POST(request: Request) {
  if (isPrelaunch) {
    return jsonError("Guided intake is not open yet. Please join the waitlist.", 403);
  }

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
      return jsonOk({ id: "demo-intake", status: "CARE_GUIDE_ASSIGNED", mode: "demo" }, 201);
    }

    const { prisma } = await import("@/lib/db");
    const careGuideId = await resolveDefaultCareGuideId();

    const intake = await prisma.intake.create({
      data: {
        ...intakeCreateData(parsed.data),
        careGuideId,
        status: careGuideId ? "CARE_GUIDE_ASSIGNED" : "NEW"
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
    ? `<p>Your Care Guide is <strong>${careGuide.name || "from Shepherds Oud"}</strong> (${careGuide.email}). They will personally review your case and guide your family through each decision.</p>`
    : "<p>A Care Guide will be assigned shortly to personally review your case and guide your family through each decision.</p>";

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "We received your Shepherds Oud care request",
      htmlContent: `<p>Hello ${name},</p><p>We received your care request. Your reference is <strong>${intakeId}</strong>.</p>${guideLine}<p><em>${ubuntuTagline}</em></p>`,
      textContent: `Hello ${name}, we received your care request. Reference: ${intakeId}. ${ubuntuTagline}`
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
