import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { resolveDefaultCareGuideId } from "@/lib/domain/care-guide";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { sendIntakeConfirmationEmails } from "@/lib/email/intake-confirmation-email";
import { intakeSchema } from "@/lib/validation/intake";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";

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
  if (getIsPrelaunch()) {
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
      runInBackground(
        () =>
          sendIntakeConfirmationEmails({
            contactName: parsed.data.contactName,
            email: parsed.data.email,
            intakeId: "demo-intake",
            careGuide: null
          }),
        "intake_confirmation_email"
      );
      return jsonOk({ id: "demo-intake", status: "CARE_GUIDE_ASSIGNED", mode: "demo" }, 201);
    }

    const { prisma } = await import("@/lib/core/db");
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

    runInBackground(
      () =>
        sendIntakeConfirmationEmails({
          contactName: parsed.data.contactName,
          email: parsed.data.email,
          intakeId: intake.id,
          careGuide: intake.careGuide
        }),
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
