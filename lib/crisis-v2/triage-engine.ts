import type { Locale } from "@/lib/i18n/config";
import type { CarePath, CareUrgency } from "@prisma/client";

export type TriageAnswers = {
  relationship: string;
  trigger: "fall" | "hospital_discharge" | "gradual_decline" | "other";
  urgency: CareUrgency;
  livingAlone: boolean;
  memoryConcerns: boolean;
  mobilityLimited: boolean;
  funding: Array<"wlz" | "pgb" | "private" | "unknown">;
};

export type TriageDiagnosis = {
  path: CarePath;
  reasonKeys: string[];
  reasoning: { nl: string; en: string };
};

const QUESTIONS = [
  {
    id: "relationship",
    type: "single" as const,
    options: ["child", "partner", "other_family", "professional", "self"]
  },
  {
    id: "trigger",
    type: "single" as const,
    options: ["fall", "hospital_discharge", "gradual_decline", "other"]
  },
  {
    id: "urgency",
    type: "single" as const,
    options: ["TODAY", "THIS_WEEK", "THIS_MONTH"]
  },
  {
    id: "situation",
    type: "multi_bool" as const,
    fields: ["livingAlone", "memoryConcerns", "mobilityLimited"]
  },
  {
    id: "funding",
    type: "multi" as const,
    options: ["wlz", "pgb", "private", "unknown"]
  }
];

export function triageQuestionCount() {
  return QUESTIONS.length;
}

export function getTriageQuestion(step: number) {
  return QUESTIONS[step - 1] ?? null;
}

export function diagnoseTriage(answers: TriageAnswers): TriageDiagnosis {
  const reasons: string[] = [];
  let facilityScore = 0;
  let homeScore = 0;

  if (answers.trigger === "hospital_discharge") {
    facilityScore += 2;
    reasons.push("hospital_discharge");
  }
  if (answers.trigger === "fall") {
    homeScore += 1;
    facilityScore += 1;
    reasons.push("fall");
  }
  if (answers.trigger === "gradual_decline") {
    homeScore += 2;
    reasons.push("gradual_decline");
  }

  if (answers.urgency === "TODAY" || answers.urgency === "THIS_WEEK") {
    facilityScore += 1;
    reasons.push("urgent_timeline");
  } else {
    homeScore += 1;
  }

  if (answers.livingAlone && answers.memoryConcerns) {
    facilityScore += 2;
    reasons.push("alone_with_memory");
  } else if (answers.livingAlone) {
    homeScore += 1;
    reasons.push("living_alone");
  }

  if (answers.mobilityLimited && !answers.memoryConcerns) {
    homeScore += 1;
    reasons.push("mobility");
  }

  if (answers.funding.includes("wlz")) {
    facilityScore += 1;
    reasons.push("wlz_context");
  }
  if (answers.funding.includes("private") || answers.funding.includes("pgb")) {
    homeScore += 1;
  }

  let path: CarePath = "UNDECIDED";
  if (facilityScore >= homeScore + 2) path = "FACILITY";
  else if (homeScore >= facilityScore + 2) path = "HOME_CARE";
  else if (facilityScore > 0 || homeScore > 0) path = "BOTH";

  return {
    path,
    reasonKeys: reasons,
    reasoning: buildReasoning(path, answers)
  };
}

function buildReasoning(path: CarePath, answers: TriageAnswers) {
  const urgencyLabel =
    answers.urgency === "TODAY" ? { nl: "vandaag", en: "today" } : answers.urgency === "THIS_WEEK" ? { nl: "deze week", en: "this week" } : { nl: "deze maand", en: "this month" };

  if (path === "FACILITY") {
    return {
      nl: `Gezien de urgentie (${urgencyLabel.nl}) en uw antwoorden over woon- en geheugensituatie lijkt een pad richting opname / intensievere voorziening het meest passend om nu te ordenen. U handelt zelf via officiële portalen.`,
      en: `Given the urgency (${urgencyLabel.en}) and your answers about living and memory situation, a facility-admission path is the most useful sequence to organise now. You complete official steps yourself via public portals.`
    };
  }

  if (path === "HOME_CARE") {
    return {
      nl: `Uw antwoorden wijzen eerder op ondersteuning thuis organiseren (thuiszorg / Wmo-route) met een overzichtelijke checklist. Urgentie: ${urgencyLabel.nl}.`,
      en: `Your answers point toward organising support at home (home care / Wmo route) with a clear checklist. Urgency: ${urgencyLabel.en}.`
    };
  }

  if (path === "BOTH") {
    return {
      nl: `Beide richtingen zijn nog reëel: thuiszorg én voorziening. De checklist helpt u beide sporen parallel te verkennen zonder meteen één deur dicht te doen.`,
      en: `Both directions remain realistic: home care and facility. The checklist helps you explore both tracks in parallel without closing a door too early.`
    };
  }

  return {
    nl: `Op basis van deze korte triage is meer informatie nodig. Start met de checklist om feiten en financiering rond te krijgen.`,
    en: `Based on this short triage, more information is needed. Start with the checklist to clarify facts and funding.`
  };
}

export function pathLabel(path: CarePath, locale: Locale) {
  const map = {
    HOME_CARE: { nl: "Eerst thuiszorg", en: "Home care first" },
    FACILITY: { nl: "Pad richting opname", en: "Facility admission path" },
    BOTH: { nl: "Beide opties", en: "Both options" },
    UNDECIDED: { nl: "Eerst oriënteren", en: "Gather information first" }
  } as const;
  return map[path][locale === "en" ? "en" : "nl"];
}

export const TRIAGE_OPTION_LABELS: Record<string, { nl: string; en: string }> = {
  child: { nl: "Kind / stiefkind", en: "Adult child" },
  partner: { nl: "Partner", en: "Partner" },
  other_family: { nl: "Ander familielid", en: "Other family" },
  professional: { nl: "Professional", en: "Professional" },
  self: { nl: "Ikzelf", en: "Myself" },
  fall: { nl: "Een val", en: "A fall" },
  hospital_discharge: { nl: "Ziekenhuisontslag", en: "Hospital discharge" },
  gradual_decline: { nl: "Geleidelijke achteruitgang", en: "Gradual decline" },
  other: { nl: "Iets anders", en: "Something else" },
  TODAY: { nl: "Vandaag", en: "Today" },
  THIS_WEEK: { nl: "Deze week", en: "This week" },
  THIS_MONTH: { nl: "Deze maand", en: "This month" },
  livingAlone: { nl: "Woont grotendeels alleen", en: "Mostly living alone" },
  memoryConcerns: { nl: "Zorgen over geheugen", en: "Memory concerns" },
  mobilityLimited: { nl: "Beperkte mobiliteit", en: "Limited mobility" },
  wlz: { nl: "Wlz-indicatie (of aangevraagd)", en: "Wlz indication (or applied)" },
  pgb: { nl: "PGB", en: "PGB" },
  private: { nl: "Volledig particulier", en: "Fully private-pay" },
  unknown: { nl: "Weet ik nog niet", en: "Not sure yet" }
};

export function triageOptionLabel(id: string, locale: Locale) {
  const entry = TRIAGE_OPTION_LABELS[id];
  if (!entry) return id;
  return locale === "en" ? entry.en : entry.nl;
}

export function triageQuestionTitle(questionId: string, locale: Locale) {
  const titles: Record<string, { nl: string; en: string }> = {
    relationship: {
      nl: "Wie heeft zorg nodig, en wat is uw relatie?",
      en: "Who needs care, and what is your relationship?"
    },
    trigger: {
      nl: "Wat is er gebeurd?",
      en: "What happened?"
    },
    urgency: {
      nl: "Hoe snel is zorg nodig?",
      en: "How soon is care needed?"
    },
    situation: {
      nl: "Wat klopt over de situatie thuis?",
      en: "What is true about the home situation?"
    },
    funding: {
      nl: "Hoe zit het met financiering?",
      en: "What is the funding context?"
    }
  };
  const entry = titles[questionId];
  if (!entry) return questionId;
  return locale === "en" ? entry.en : entry.nl;
}
