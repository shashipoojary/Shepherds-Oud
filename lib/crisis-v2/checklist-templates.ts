import type { CarePath } from "@prisma/client";

export type ChecklistTemplateItem = {
  sortOrder: number;
  labelNl: string;
  labelEn: string;
  descriptionNl: string;
  descriptionEn: string;
  externalLink: string;
  deadlineDaysFromNow: number | null;
};

const HOME_CARE: ChecklistTemplateItem[] = [
  {
    sortOrder: 1,
    labelNl: "Check of Wmo-ondersteuning past",
    labelEn: "Check whether Wmo support fits",
    descriptionNl: "Lees de gemeentelijke Wmo-informatie voor uw regio en bereid een melding voor. Wij dienen niets in namens u.",
    descriptionEn: "Read your municipality’s Wmo guidance and prepare a report. We do not submit anything on your behalf.",
    externalLink: "https://www.denhaag.nl/nl/zorg-en-ondersteuning/",
    deadlineDaysFromNow: 7
  },
  {
    sortOrder: 2,
    labelNl: "Verzamel basisdocumenten",
    labelEn: "Gather basic documents",
    descriptionNl: "ID, zorgverzekering, recente medicatielijst, en eventuele ontslagbrief.",
    descriptionEn: "ID, health insurance, recent medication list, and any discharge letter.",
    externalLink: "https://www.rijksoverheid.nl/onderwerpen/zorg-en-ondersteuning-thuis",
    deadlineDaysFromNow: 10
  },
  {
    sortOrder: 3,
    labelNl: "Vergelijk thuiszorgaanbieders",
    labelEn: "Compare home-care providers",
    descriptionNl: "Gebruik de Haaglanden-directory in deze app om aanbieders te filteren en contact op te nemen.",
    descriptionEn: "Use this app’s Haaglanden directory to filter providers and make contact.",
    externalLink: "/directory?type=HOME_CARE",
    deadlineDaysFromNow: 14
  }
];

const FACILITY: ChecklistTemplateItem[] = [
  {
    sortOrder: 1,
    labelNl: "Oriënteer op Wlz / CIZ",
    labelEn: "Orient on Wlz / CIZ",
    descriptionNl: "Bekijk mijnCIZ en of een Wlz-indicatie nodig is. U logt zelf in met DigiD op het officiële portaal.",
    descriptionEn: "Review mijnCIZ and whether a Wlz indication is needed. You sign in yourself with DigiD on the official portal.",
    externalLink: "https://www.ciz.nl/",
    deadlineDaysFromNow: 7
  },
  {
    sortOrder: 2,
    labelNl: "Verzamel opnamedocumenten",
    labelEn: "Gather admission documents",
    descriptionNl: "ID, verzekering, medicatie, en eventuele ontslag- of behandelinformatie.",
    descriptionEn: "ID, insurance, medication, and any discharge or treatment information.",
    externalLink: "https://www.rijksoverheid.nl/onderwerpen/verpleeghuiszorg",
    deadlineDaysFromNow: 10
  },
  {
    sortOrder: 3,
    labelNl: "Vergelijk woonzorglocaties",
    labelEn: "Compare residential facilities",
    descriptionNl: "Filter de directory op residentieel, taal en financiering; neem contact op via de app.",
    descriptionEn: "Filter the directory by residential, language, and funding; contact through the app.",
    externalLink: "/directory?type=RESIDENTIAL",
    deadlineDaysFromNow: 14
  },
  {
    sortOrder: 4,
    labelNl: "Plan bezoeken / gesprekken",
    labelEn: "Plan visits / calls",
    descriptionNl: "Noteer wat u wilt vragen (zorgniveau, wachttijd, eigen bijdrage).",
    descriptionEn: "Note what you want to ask (care level, wait time, personal contribution).",
    externalLink: "/directory",
    deadlineDaysFromNow: 21
  }
];

export function checklistTemplateForPath(path: CarePath | null | undefined): ChecklistTemplateItem[] {
  if (path === "HOME_CARE") return HOME_CARE;
  if (path === "FACILITY") return FACILITY;
  if (path === "BOTH") {
    return [
      ...HOME_CARE.map((item, index) => ({ ...item, sortOrder: index + 1 })),
      ...FACILITY.map((item, index) => ({
        ...item,
        sortOrder: HOME_CARE.length + index + 1,
        labelNl: `Voorziening: ${item.labelNl}`,
        labelEn: `Facility: ${item.labelEn}`
      }))
    ];
  }

  return [
    {
      sortOrder: 1,
      labelNl: "Breng de situatie in één pagina in kaart",
      labelEn: "Map the situation on one page",
      descriptionNl: "Noteer wat er gebeurde, urgentie, en wie beslist.",
      descriptionEn: "Note what happened, urgency, and who decides.",
      externalLink: "/triage/1",
      deadlineDaysFromNow: 3
    },
    ...HOME_CARE.slice(0, 2).map((item, index) => ({ ...item, sortOrder: index + 2 }))
  ];
}

export function deadlineFromTemplate(days: number | null) {
  if (days === null) return null;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}
