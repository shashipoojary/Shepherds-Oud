import { getServerSession, getUserRole } from "@/lib/auth/server";
import { INTAKE_CONSENT_VERSION } from "@/lib/domain/intake-consent";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { sendHospitalReferralFamilyEmails } from "@/lib/email/hospital-referral-family-email";
import { findFamilyOwnerIdByEmail } from "@/lib/hospitals/claim-family-intakes";
import { getLocale } from "@/lib/i18n/get-locale";
import { hospitalReferralSchemaFor } from "@/lib/validation/hospital-referral";

export const runtime = "nodejs";

async function requireHospitalUser() {
  const session = await getServerSession();
  if (!session) {
    return { error: jsonError("Please sign in.", 401) };
  }
  if (getUserRole(session) !== "HOSPITAL") {
    return { error: jsonError("Hospital access required.", 403) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      linkedHospitalId: true,
      linkedHospital: { select: { id: true, name: true } }
    }
  });

  if (!user?.linkedHospitalId || !user.linkedHospital) {
    return { error: jsonError("No hospital is linked to this account.", 403) };
  }

  return { session, user, hospital: user.linkedHospital };
}

export async function GET() {
  try {
    const auth = await requireHospitalUser();
    if (auth.error) return auth.error;

    const referrals = await prisma.intake.findMany({
      where: { referringHospitalId: auth.hospital.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        contactName: true,
        email: true,
        phone: true,
        preferredArea: true,
        urgency: true,
        careTypes: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return jsonOk({
      hospital: auth.hospital,
      referrals: referrals.map((item) => ({
        id: item.id,
        contactName: item.contactName,
        email: item.email,
        phone: item.phone,
        preferredArea: item.preferredArea,
        urgency: item.urgency,
        careTypes: item.careTypes,
        status: normalizeIntakeStatus(item.status),
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    return handleApiError(error, "hospital_referrals_list");
  }
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "hospital-referral-create", 20, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await requireHospitalUser();
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    const locale = await getLocale();
    const parsed = hospitalReferralSchemaFor(locale).safeParse(body);

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return jsonError(first || "Invalid referral details.", 400, { issues: parsed.error.flatten() });
    }

    const data = parsed.data;
    const familyOwnerId = await findFamilyOwnerIdByEmail(data.email);

    const intake = await prisma.intake.create({
      data: {
        contactName: data.contactName,
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        relationship: "Hospital referral",
        preferredArea: data.preferredArea,
        preferredDistance: "Not sure yet",
        ageRange: data.ageRange?.trim() || "Not specified",
        careTypes: data.careTypes,
        urgency: data.urgency,
        medicalSupportNeeds: "Not sure",
        personSafeTonight: "Unsure",
        urgentMedicalHelp: "Unsure",
        canRemainHomeTonight: "Unsure",
        caregiverBurnoutRisk: "Unsure",
        seniorAgreedToSearch: "Unsure",
        notes: data.notes?.trim() || null,
        livingSituation: "In hospital",
        preferredLocale: locale,
        languages: [],
        additionalNeeds: [],
        fundingTypes: [],
        functionalNeeds: [],
        placementPreferences: [],
        emotionalSupportNeeds: [],
        supportTypes: [],
        immediateRiskFlags: [],
        status: "NEW",
        referralSource: "HOSPITAL",
        referringHospitalId: auth.hospital.id,
        referredByUserId: auth.user.id,
        ...(familyOwnerId ? { userId: familyOwnerId } : {}),
        consentAcceptedAt: new Date(),
        consentVersion: INTAKE_CONSENT_VERSION,
        decisionMakers: {
          create: [
            {
              name: data.contactName.trim(),
              relationship: "Family contact",
              responsibilities: []
            }
          ]
        }
      },
      select: {
        id: true,
        contactName: true,
        status: true,
        createdAt: true
      }
    });

    await sendHospitalReferralFamilyEmails({
      contactName: data.contactName,
      email: data.email.trim().toLowerCase(),
      intakeId: intake.id,
      hospitalName: auth.hospital.name,
      locale
    }).catch((error) => {
      console.error("hospital_referral_family_email_failed", error);
    });

    return jsonOk(
      {
        id: intake.id,
        contactName: intake.contactName,
        status: normalizeIntakeStatus(intake.status),
        createdAt: intake.createdAt.toISOString(),
        familyLinked: Boolean(familyOwnerId)
      },
      201
    );
  } catch (error) {
    return handleApiError(error, "hospital_referral_create");
  }
}
