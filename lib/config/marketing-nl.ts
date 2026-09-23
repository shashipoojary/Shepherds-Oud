import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";

/** Core positioning — used across marketing surfaces. */
export const positioningStatementNl =
  "Shepherds Oud Care helpt families handelen wanneer ouderenzorg plots urgent wordt — korte triage, een duidelijk pad, een checklist en een Haaglanden-directory. Gratis voor families.";

/** Primary positioning line for intake notices and short surfaces. */
export const siteTaglineNl = "Zorg zoeken hoort niet overweldigend te zijn.";

export function homeHeroCopy(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Vroege aanmeldingen open" : "Den Haag / Haaglanden",
    headline: "Wat moet ik nu doen?",
    supportLine:
      "Bij een val, ziekenhuisontslag of snelle achteruitgang: start een korte triage — krijg een aanbevolen pad, bewaar een checklist en bekijk lokale aanbieders. Gratis voor families. Geen login om te starten.",
    intro: prelaunch
      ? "Meld u nu aan; wij nemen contact op wanneer crisis-triage in uw regio start."
      : "Start triage online in enkele minuten — of bel ons als een formulier te zwaar voelt."
  };
}

export const homeContentNl = {
  primaryCta: "Start triage",
  primaryCtaShort: "Triage",
  secondaryCta: "Bekijk aanbieders",
  secondaryCtaShort: "Directory",
  responsePromise: "Gratis voor families. Geen login om te starten.",
  freeSupportLine:
    "Gratis voor families. Sommige aanbieders betalen een succesfee als een plaatsing via onze directory tot stand komt — dat verandert niet welke opties wij tonen.",
  problem: {
    label: "De uitdaging",
    title: "Als zorg urgent wordt, raken families vast.",
    bullets: [
      "Een val, ontslag of snelle achteruitgang van de ene op de andere dag",
      "Onduidelijk of thuiszorg of een locatie eerst komt",
      "CIZ-, DigiD- en gemeenteportalen die u zelf moet gebruiken",
      "Lange wachtlijsten en honderden aanbieders",
      "Geen eenduidige checklist van wat u nu moet doen",
      "Complexe Wmo- / Wlz-financieringsroutes"
    ],
    closing:
      "Shepherds Oud Care geeft u een duidelijk eerste pad en vervolgstappen — zonder te beloven dat wij formulieren voor u indienen."
  },
  valueProps: {
    label: "Wat u krijgt",
    title: "Duidelijkheid in één keer",
    description:
      "Crisis-triage is gemaakt voor het moment dat zorg plots urgent wordt — geen lange matching-reis met week-tot-week nazorg.",
    items: [
      {
        title: "Een aanbevolen pad",
        text: "Eerst thuiszorg, opnamepad, beide, of eerst informatie verzamelen — met begrijpelijke onderbouwing."
      },
      {
        title: "Een checklist die u kunt volgen",
        text: "Vervolgstappen met deadlines en optionele herinneringen zonder patiëntnamen of gezondheidsdetails."
      },
      {
        title: "Lokale aanbieders",
        text: "Bekijk de Haaglanden-directory en vraag een introductie vanuit uw dossier wanneer u er klaar voor bent."
      }
    ]
  },
  ourRole: {
    title: "Onze rol",
    description: positioningStatementNl,
    points: [
      "Softwaregestuurde triage en padadvies — geen medisch advies",
      "Checklists die linken naar officiële portalen (CIZ, DigiD, gemeente) zodat u zelf handelt",
      "Haaglanden-directory met transparante succesfee-vermelding",
      "Menselijke ondersteuning per telefoon of e-mail wanneer nodig",
      "Geen garantie op opname; wij vervangen geen arts, gemeente of spoeddiensten"
    ]
  },
  familySteps: [
    {
      title: "Start triage",
      text: "Beantwoord vijf korte vragen over urgentie, situatie en financiering — geen account nodig."
    },
    {
      title: "Bekijk uw pad",
      text: "Krijg een aanbevolen richting: eerst thuiszorg, opnamepad, beide, of eerst informatie verzamelen — met duidelijke onderbouwing."
    },
    {
      title: "Bewaar en plan",
      text: "Maak een familieaccount, bevestig voor wie u handelt, en ontgrendel een checklist met vervolgstappen."
    },
    {
      title: "Bekijk lokale aanbieders",
      text: "Filter thuiszorg en woonzorg in Haaglanden en vraag een introductie vanuit uw dossier."
    },
    {
      title: "Handel op officiële portalen",
      text: "Elke checkliststap linkt naar officiële bronnen. Wij dienen niets in bij CIZ, DigiD of uw gemeente."
    }
  ],
  humanSupport: {
    label: "Menselijke steun",
    title: `Gebouwd door ${brand.founderName}`,
    credentials:
      "Als een formulier te zwaar voelt, bel of mail ons. Wij kennen het Nederlandse zorglandschap — en zijn eerlijk over wat software wel en niet kan.",
    bio: `${brand.founderName} bouwde Shepherds Oud Care omdat families in crisis verdwalen tussen directories en papieren. Start online in minuten; bereik een mens wanneer u dat nodig heeft.`
  },
  providerSteps: [
    {
      title: "Relevante familie-introducties",
      text: "Families komen binnen met een triagepad en context — geen koude directory-spam."
    },
    {
      title: "Gratis vermelden, betalen bij plaatsing",
      text: "Geen abonnement om zichtbaar te zijn. Succesfee alleen bij een plaatsing via verwijzing — zie onze pagina voor aanbieders."
    },
    {
      title: "Plaatsingen bevestigen",
      text: "Partners bevestigen plaatsingen zodat de fee-status klopt."
    }
  ],
  prelaunch: {
    title: "Meld uw interesse",
    description: "Families en aanbieders in heel Nederland kunnen zich nu al registreren.",
    familyCta: "Interest registreren",
    facilityCta: "Locatie registreren"
  },
  live: {
    title: "Start triage",
    description: "Vijf vragen, een aanbevolen pad en een checklist die u kunt volgen.",
    familyCta: "Start triage",
    facilityCta: "Registreer uw locatie"
  },
  internationalsCta: {
    title: "International in the Netherlands?",
    text: "English-language navigation of the Dutch care system (CIZ, Wlz, Wmo, eigen bijdrage) — built for embassy, court, and corporate families.",
    href: "/internationals",
    cta: "Read in English"
  }
};

/** Keep ubuntuTagline alias for intake/emails until those surfaces are localized. */
export const ubuntuTagline = siteTaglineNl;
