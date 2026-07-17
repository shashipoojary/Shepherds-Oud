import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";

/** Primary positioning — replace “mobility limited” framing. */
export const siteTaglineNl = "Niemand hoeft alleen te zoeken naar zorg als thuis wonen niet meer gaat.";

export function homeHeroCopy(prelaunch = getIsPrelaunch()) {
  return {
    badge: prelaunch ? "Vroege aanmeldingen open" : `Actief in ${brand.regionPrimary}`,
    headline: "Een begeleide reis — geen gids",
    supportLine:
      "Gratis voor families. Shepherds Oud wordt betaald door deelnemende zorgaanbieders. Uw keuzes worden nooit beperkt tot alleen betalende aanbieders.",
    intro: prelaunch
      ? `${brand.regionNote} Meld u nu aan; wij nemen contact op wanneer matching in uw regio start.`
      : `${brand.regionNote} Een vaste Care Guide begeleidt u van intake tot plaatsing en nazorg.`
  };
}

export const homeContentNl = {
  responsePromise: "Een Care Guide belt u binnen 24 uur.",
  freeSupportLine:
    "Gratis voor families. Shepherds Oud wordt gecompenseerd door deelnemende zorgaanbieders. Transparant over hoe we betaald worden — zodat u weet dat uw opties niet afhangen van wie betaalt.",
  followUp: {
    label: "Nazorg",
    title: "Wij blijven tot het werkt",
    description:
      "Na plaatsing checken we in op 7, 30 en 90 dagen. Dat doet bijna niemand in deze markt — niet de gidsen, niet de bemiddeling. Wij wel, met dezelfde Care Guide."
  },
  ourRole: {
    title: "Onze rol",
    description:
      "Shepherds Oud helpt met navigatie, matching en coördinatie in het Nederlandse zorgstelsel (Wlz, Wmo, CIZ, PGB, eigen bijdrage, zorgkantoor). Wij geven geen medisch advies, garanderen geen opname, en vervangen geen arts, gemeente of spoedzorg (112).",
    points: [
      "Navigatie, matching en coördinatie",
      "Geen medisch advies",
      "Geen garantie op opname",
      "Vervangt geen arts, gemeente, zorgkantoor of spoeddiensten",
      "Geen definitieve indicatiebeslissingen (CIZ / gemeente)"
    ]
  },
  familySteps: [
    {
      title: "Vertel uw situatie",
      text: "Intake over thuissituatie, dementie of zorgbehoefte, urgentie, budget (Wlz / Wmo / PGB), taal en wie meebeslist."
    },
    {
      title: "Ontmoet uw Care Guide",
      text: "Een vast aanspreekpunt beoordeelt uw dossier, maakt een zorgplan en begeleidt elke volgende stap — u doet dit niet alleen."
    },
    {
      title: "Bezoeken, plaatsing en nazorg",
      text: "Matching met passende aanbieders, geplande bezoeken of terugbelafspraken, plaatsing, en check-ins op 7, 30 en 90 dagen."
    }
  ],
  careGuide: {
    label: "Uw Care Guide",
    title: `Begeleiding door ${brand.founderName}`,
    credentials:
      "Begeleiding door zorgprofessionals die het Nederlandse stelsel kennen — van CIZ-aanvraag tot eigen bijdrage en keuze tussen thuiszorg, zorgvilla of verpleeghuis.",
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
    description: `${brand.regionNote} Families en aanbieders kunnen zich nu al registreren.`,
    familyCta: "Interest registreren",
    facilityCta: "Locatie registreren"
  },
  live: {
    title: "Start uw begeleide zorgreis",
    description: "Rond de intake af. Een Care Guide belt binnen 24 uur en begeleidt u verder.",
    familyCta: "Intake starten",
    facilityCta: "Registreer uw locatie"
  },
  internationalsCta: {
    title: "International in The Hague?",
    text: "English-language navigation of the Dutch care system (CIZ, Wlz, Wmo, eigen bijdrage) — built for embassy, court, and corporate families.",
    href: "/internationals",
    cta: "Read in English"
  }
};

/** Keep ubuntuTagline alias for intake/emails until those surfaces are localized. */
export const ubuntuTagline = siteTaglineNl;
