import { z } from "zod";
import { isEmergencyIntakeStop } from "@/lib/domain/intake-field-utils";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

const decisionMakerSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  responsibilities: z.array(z.string()).default([])
});

export const intakeSchema = z
  .object({
    contactName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    relationship: z.string().min(1),
    preferredArea: z.string().min(1),
    preferredDistance: optionalText,
    ageRange: optionalText,
    careTypes: z.array(z.string()).default([]),
    urgency: optionalText,
    budget: optionalText,
    fundingTypes: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    additionalNeeds: z.array(z.string()).default([]),
    functionalNeeds: z.array(z.string()).default([]),
    placementPreferences: z.array(z.string()).default([]),
    livingSituation: optionalText,
    moveInTimeline: optionalText,
    mobility: optionalText,
    medicalSupportNeeds: optionalText,
    dementiaNeeds: optionalText,
    hospitalDischargeDate: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value && value.trim().length ? value.trim() : undefined)),
    decisionMakerName: optionalText,
    decisionMakerRelationship: optionalText,
    decisionMakers: z.array(decisionMakerSchema).default([]),
    seniorAgreedToSearch: optionalText,
    decisionParticipants: optionalText,
    emotionalSupportNeeds: z.array(z.string()).default([]),
    supportTypes: z.array(z.string()).default([]),
    notes: optionalText,
    personSafeTonight: optionalText,
    urgentMedicalHelp: optionalText,
    canRemainHomeTonight: optionalText,
    caregiverBurnoutRisk: optionalText,
    immediateRiskFlags: z.array(z.string()).default([]),
    emergencyStopped: z.boolean().optional().default(false),
    consentAccepted: z.literal(true).optional()
  })
  .superRefine((data, ctx) => {
    const emergency =
      data.emergencyStopped ||
      isEmergencyIntakeStop({
        personSafeTonight: data.personSafeTonight,
        urgentMedicalHelp: data.urgentMedicalHelp,
        immediateRiskFlags: data.immediateRiskFlags
      });

    if (!emergency && data.consentAccepted !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Consent is required before submitting your care request.",
        path: ["consentAccepted"]
      });
    }

    if (emergency) {
      if (!data.personSafeTonight) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["personSafeTonight"] });
      }
      if (!data.urgentMedicalHelp) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["urgentMedicalHelp"] });
      }
      return;
    }

    const required: Array<[keyof typeof data, string]> = [
      ["preferredDistance", "preferredDistance"],
      ["ageRange", "ageRange"],
      ["urgency", "urgency"],
      ["medicalSupportNeeds", "medicalSupportNeeds"]
    ];

    for (const [key, path] of required) {
      if (!data[key]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: [path] });
      }
    }

    if (!data.careTypes.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one care type", path: ["careTypes"] });
    }

    if (!data.decisionMakers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one decision-maker",
        path: ["decisionMakers"]
      });
    } else {
      data.decisionMakers.forEach((maker, index) => {
        if (!maker.name.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Name is required",
            path: ["decisionMakers", index, "name"]
          });
        }
        if (!maker.relationship.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Relationship is required",
            path: ["decisionMakers", index, "relationship"]
          });
        }
      });
    }

    if (!data.personSafeTonight) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["personSafeTonight"] });
    }
    if (!data.urgentMedicalHelp) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["urgentMedicalHelp"] });
    }
    if (!data.canRemainHomeTonight) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["canRemainHomeTonight"] });
    }
    if (!data.caregiverBurnoutRisk) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["caregiverBurnoutRisk"] });
    }
    if (!data.seniorAgreedToSearch) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["seniorAgreedToSearch"] });
    }
  })
  .transform((data) => {
    const emergencyStopped =
      data.emergencyStopped ||
      isEmergencyIntakeStop({
        personSafeTonight: data.personSafeTonight,
        urgentMedicalHelp: data.urgentMedicalHelp,
        immediateRiskFlags: data.immediateRiskFlags
      });

    const decisionMakers = data.decisionMakers.length
      ? data.decisionMakers
      : data.decisionMakerName && data.decisionMakerRelationship
        ? [
            {
              name: data.decisionMakerName,
              relationship: data.decisionMakerRelationship,
              responsibilities: [] as string[]
            }
          ]
        : [];

    const first = decisionMakers[0];

    return {
      ...data,
      emergencyStopped,
      decisionMakers,
      decisionMakerName: first?.name || data.decisionMakerName,
      decisionMakerRelationship: first?.relationship || data.decisionMakerRelationship,
      careTypes: data.careTypes,
      urgency: data.urgency || (emergencyStopped ? "Emergency screening" : data.urgency),
      ageRange: data.ageRange || (emergencyStopped ? "Not specified" : data.ageRange),
      preferredDistance: data.preferredDistance || (emergencyStopped ? "Not sure yet" : data.preferredDistance),
      medicalSupportNeeds: data.medicalSupportNeeds || (emergencyStopped ? "Not sure yet" : data.medicalSupportNeeds)
    };
  });

export type IntakeInput = z.infer<typeof intakeSchema>;
export type DecisionMakerInput = z.infer<typeof decisionMakerSchema>;
