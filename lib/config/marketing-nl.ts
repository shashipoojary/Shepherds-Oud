import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";

/** Core positioning — used across marketing surfaces. */
export const positioningStatementNl =
  "Shepherds Oud is het vertrouwde zorgnavigatieplatform dat ouderen en hun families begeleidt door elke fase van ouder worden — van zelfstandig wonen, naar thuiszorg, naar begeleid wonen, naar verpleegzorg, via één adviseur.";

/** Primary positioning line for intake notices and short surfaces. */
export const siteTaglineNl = "Zorg zoeken hoort niet overweldigend te zijn.";

export function homeHeroCopy(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Vroege aanmeldingen open" : "Voor families in heel Nederland",
    headline: "Navigeer met vertrouwen door ouder worden.",
    supportLine:
      "Eén vaste Care Guide. Persoonlijk advies. Geverifieerde aanbieders. Ondersteuning van het eerste gesprek tot ver na plaatsing.",
    intro: prelaunch
      ? "Meld u nu aan; wij nemen contact op wanneer begeleide matching in uw regio start."
      : "Start online, of spreek een Care Guide als u eerst wilt praten."
  };
}

export const homeContentNl = {
  primaryCta: "Start uw zorgreis",
  primaryCtaShort: "Zorgreis",
  secondaryCta: "Spreek een Care Guide",
  secondaryCtaShort: "Care Guide",
  responsePromise: "Een Care Guide belt u binnen 24 uur.",
  freeSupportLine:
    "Gratis voor families. Shepherds Oud wordt gecompenseerd door deelnemende zorgaanbieders. Transparant over hoe we betaald worden — zodat u weet dat uw opties niet afhangen van wie betaalt.",
  problem: {
    label: "De uitdaging",
    title: "Nederland verandert.",
    bullets: [
      "Meer ouderen dan ooit",
      "Langere wachtlijsten",
      "Minder mantelzorgers",
      "Families die alles moeten coördineren",
      "Honderden aanbieders om te vergelijken",
      "Complexe Wmo-regels",
      "Woningtekorten"
    ],
    closing: "Families raken overweldigd. Shepherds Oud vereenvoudigt elke stap."
  },
  followUp: {
    label: "Nazorg",
    title: "Wij blijven tot het werkt",
    description:
      "Na plaatsing checken we in op 7, 30 en 90 dagen. Dat doet bijna niemand in deze markt — niet de gidsen, niet de bemiddeling. Wij wel, met dezelfde Care Guide.",
    daysLabel: "dagen"
  },
  ourRole: {
    title: "Onze rol",
    description: positioningStatementNl,
    points: [
      "Navigatie, matching en coördinatie via één Care Guide",
      "Geen medisch advies",
      "Geen garantie op opname",
      "Vervangt geen arts, gemeente, zorgkantoor of spoeddiensten",
      "Geen definitieve indicatiebeslissingen (CIZ / gemeente)"
    ]
  },
  familySteps: [
    {
      title: "Vertel over uw naaste",
      text: "Een begeleide intake (ongeveer 10 minuten) over medische behoeften, voorkeuren, locatie, taal, mobiliteit en budget."
    },
    {
      title: "Behoeften begrijpen",
      text: "Uw Care Guide bepaalt zorgniveau, risico's, budget, Wmo-overwegingen en urgentie — zodat besluiten stevig staan, niet op giswerk."
    },
    {
      title: "Verken alle opties",
      text: "Bekijk zorgpaden die bij uw situatie passen — waaronder thuiszorg, begeleid wonen, revalidatie, dementiezorg, respijtzorg, dagbesteding en verpleegzorg."
    },
    {
      title: "Ontvang een Care Roadmap",
      text: "Aanbevolen opties met geschatte wachttijden waar bekend, kosten en financieringsroutes, en duidelijke vervolgstappen van uw Care Guide."
    },
    {
      title: "Bezoek aanbieders",
      text: "Vraag bezoeken of terugbelafspraken aan via uw dashboard. Uw Care Guide helpt met vragen en kan meegaan wanneer nodig."
    },
    {
      title: "Verhuis met vertrouwen",
      text: "Hulp bij documentatie, een verhuischecklist, afstemming in de familie en communicatie met de gekozen aanbieder."
    },
    {
      title: "Blijf ondersteund",
      text: "Nazorg op 7, 30 en 90 dagen na plaatsing — met dezelfde Care Guide — zodat de regeling blijft werken."
    }
  ],
  careGuide: {
    label: "Uw Care Guide",
    title: `Begeleiding door ${brand.founderName}`,
    credentials:
      "Begeleiding door zorgprofessionals die het Nederlandse stelsel kennen — van CIZ-aanvraag tot eigen bijdrage en keuze tussen thuiszorg, begeleid wonen of verpleegzorg.",
    bio: `${brand.founderName} bouwde Shepherds Oud omdat families in crisis verdwalen tussen directories en papieren. Één menselijke lijn van eerste gesprek tot nazorg — geen anonieme zoekmachine.`
  },
  providerSteps: [
    {
      title: "Alleen passende aanvragen",
      text: "Families worden vooraf gematcht op zorgtype, taal, dementiecapaciteit en beschikbaarheid."
    },
    {
      title: "Gratis vermelden, betalen bij plaatsing",
      text: "Geen abonnement om zichtbaar te zijn. U betaalt alleen bij een succesvolle plaatsing — zie onze pagina voor aanbieders."
    },
    {
      title: "Leads beheren",
      text: "Accepteer, wijs af met reden, of volg op vanuit één dashboard."
    }
  ],
  prelaunch: {
    title: "Meld uw interesse",
    description: "Families en aanbieders in heel Nederland kunnen zich nu al registreren.",
    familyCta: "Interest registreren",
    facilityCta: "Locatie registreren"
  },
  live: {
    title: "Start uw zorgreis",
    description: "Rond de intake af. Een Care Guide belt binnen 24 uur en begeleidt u verder.",
    familyCta: "Start uw zorgreis",
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
