import type { Locale } from "@/lib/i18n/config";

const en = {
  aiDisclosure:
    "Path recommendations and checklist steps are software-generated to help you prioritise. They are not medical advice. Call or email us if you need human support.",
  facilityPayDisclosure:
    "Some facilities and home-care providers may pay Shepherds Oud Care a success fee if a placement starts through this directory. That does not change which options we show.",
  digidHonesty:
    "We never submit forms to CIZ, DigiD, or your gemeente for you. Each checklist step links to the official portal so you can act yourself.",
  landing: {
    eyebrow: "Den Haag / Haaglanden",
    title: "What should I do right now?",
    intro:
      "When eldercare suddenly becomes urgent — a fall, hospital discharge, or rapid decline — this short triage helps you choose a path and track next steps. Free for families. No login to start.",
    cta: "Start triage",
    directoryCta: "Browse local providers"
  },
  triage: {
    progress: (current: number, total: number) => `Question ${current} of ${total}`,
    back: "Back",
    continue: "Continue",
    seeResult: "See my path"
  },
  result: {
    title: "Your recommended path",
    reasoningTitle: "Why this path",
    nextCta: "Save result and continue",
    homeCare: "Home care first",
    facility: "Facility admission path",
    both: "You may have both options",
    undecided: "Gather information first"
  },
  signup: {
    title: "Create your family account",
    intro: "Save this result and unlock your track-and-remind checklist.",
    continueLogin: "Sign in to continue"
  },
  patient: {
    title: "About the person needing care",
    selfAttest: "I confirm I am authorised to act for them",
    legalRep: "A formal legal representative (bewindvoerder / mentor) is on record",
    inviteLater: "Invite the patient to view this case later",
    save: "Save and open dashboard"
  },
  dashboard: {
    title: "Your next steps",
    empty: "No tasks yet.",
    directory: "Browse providers",
    settings: "Settings",
    stepsHeading: "Checklist",
    introductionsHeading: "Your introductions",
    introductionsEmpty: "No introductions yet. Browse the directory and request one when you are ready.",
    introductionsEmptyCta: "Open directory",
    referralRequested: "Requested",
    referralConfirmed: "Provider confirmed",
    referralPaid: "Placement recorded",
    referralDeclined: "Closed",
    referralNextRequested: "Shepherds Oud Care will follow up with this provider. You will see an update here.",
    referralNextConfirmed:
      "The provider confirmed interest. Use the contact details below, or wait for Shepherds Oud Care to connect you.",
    referralNextPaid: "Placement is recorded. Stay in touch with the provider using the details below.",
    referralNextDeclined: "This introduction was closed. You can request another provider from the directory.",
    referralContactHeading: "Contact",
    statusNotStarted: "Not started",
    statusInProgress: "In progress",
    statusDone: "Done",
    checklistAllDone: "All steps done — tap to review"
  },
  task: {
    openOfficial: "Open official resource",
    markDone: "Mark done",
    markInProgress: "Mark in progress",
    deadline: "Deadline",
    back: "Back to next steps"
  },
  directory: {
    title: "Care providers in Haaglanden",
    subtitle: "Browse local home care and residential options in Den Haag / Haaglanden.",
    filters: "Filters",
    filterType: "Care type",
    filterMunicipality: "Municipality",
    typeAll: "All types",
    typeHomeCare: "Home care",
    typeResidential: "Residential",
    municipalityAll: "All Haaglanden",
    details: "View details",
    back: "Back to directory",
    languages: "Languages",
    funding: "Funding",
    website: "Website",
    contact: "Request an introduction",
    contacting: "Sending…",
    contacted:
      "Introduction requested. It now appears under Your introductions on your dashboard.",
    contactDone: "Introduction requested",
    contactFailed: "Could not send the introduction request. Please try again.",
    browseOnlyTitle: "Browsing without a care case",
    browseOnlyBody:
      "You can read listings here anytime. To request an introduction, finish triage and open the directory from your dashboard.",
    browseOnlyCtaDashboard: "Go to my dashboard",
    browseOnlyCtaTriage: "Start triage",
    readyToContact: "This request will be linked to your current care case.",
    needLogin: "Sign in to request an introduction for your care case.",
    needLoginCta: "Sign in",
    empty: "No providers match these filters yet.",
    loadError: "Could not load the directory. Please refresh and try again.",
    loadDetailError: "Could not load this provider. Please go back and try again."
  },
  settings: {
    title: "Settings",
    back: "Back to next steps",
    language: "Language",
    notifications: "Deadline reminders",
    notificationsHint:
      "Reminders never include patient names or health details — only a short prompt to open your dashboard.",
    enablePush: "Enable reminders",
    disablePush: "Disable reminders",
    pushUnsupported: "Reminders are not supported in this browser.",
    pushDenied: "Notification permission was denied. You can enable it in your browser settings.",
    pushUnavailable:
      "Reminders are not fully configured on this site yet. You can still use your checklist deadlines here.",
    pushSaved: "Reminders enabled.",
    pushSaveFailed: "Could not save reminder settings. Please try again.",
    consent: "Consent & linked roles"
  },
  partner: {
    title: "Confirm a placement",
    intro: "Confirm that a referred family became a placement so the success-fee record can update.",
    confirm: "Confirm placement",
    empty: "No pending referrals."
  }
} as const;

const nl = {
  aiDisclosure:
    "Padadvies en checkliststappen zijn softwarematig gegenereerd om u te helpen prioriteiten te zetten. Dit is geen medisch advies. Bel of mail ons als u menselijke steun nodig heeft.",
  facilityPayDisclosure:
    "Sommige locaties en thuiszorgaanbieders betalen Shepherds Oud Care een succesfee als een plaatsing via deze directory tot stand komt. Dat verandert niet welke opties wij tonen.",
  digidHonesty:
    "Wij dienen niets in bij CIZ, DigiD of uw gemeente. Elke checkliststap linkt naar het officiële portaal zodat u zelf kunt handelen.",
  landing: {
    eyebrow: "Den Haag / Haaglanden",
    title: "Wat moet ik nu doen?",
    intro:
      "Als ouderenzorg plots urgent wordt — een val, ziekenhuisontslag of snelle achteruitgang — helpt deze korte triage u een pad te kiezen en vervolgstappen bij te houden. Gratis voor families. Geen login om te starten.",
    cta: "Start triage",
    directoryCta: "Bekijk lokale aanbieders"
  },
  triage: {
    progress: (current: number, total: number) => `Vraag ${current} van ${total}`,
    back: "Terug",
    continue: "Verder",
    seeResult: "Bekijk mijn pad"
  },
  result: {
    title: "Uw aanbevolen pad",
    reasoningTitle: "Waarom dit pad",
    nextCta: "Resultaat opslaan en doorgaan",
    homeCare: "Eerst thuiszorg",
    facility: "Pad richting opname",
    both: "U heeft mogelijk beide opties",
    undecided: "Eerst informatie verzamelen"
  },
  signup: {
    title: "Maak een familie-account",
    intro: "Bewaar dit resultaat en open uw track-and-remind checklist.",
    continueLogin: "Log in om door te gaan"
  },
  patient: {
    title: "Over de persoon die zorg nodig heeft",
    selfAttest: "Ik bevestig dat ik bevoegd ben om voor hen te handelen",
    legalRep: "Er is een formele wettelijke vertegenwoordiger (bewindvoerder / mentor)",
    inviteLater: "Nodig de patiënt later uit om deze zaak te bekijken",
    save: "Opslaan en dashboard openen"
  },
  dashboard: {
    title: "Uw volgende stappen",
    empty: "Nog geen taken.",
    directory: "Bekijk aanbieders",
    settings: "Instellingen",
    stepsHeading: "Checklist",
    introductionsHeading: "Uw introducties",
    introductionsEmpty: "Nog geen introducties. Bekijk de directory en vraag er een aan wanneer u klaar bent.",
    introductionsEmptyCta: "Open directory",
    referralRequested: "Aangevraagd",
    referralConfirmed: "Aanbieder bevestigd",
    referralPaid: "Plaatsing vastgelegd",
    referralDeclined: "Afgesloten",
    referralNextRequested:
      "Shepherds Oud Care neemt contact op met deze aanbieder. U ziet hier een update.",
    referralNextConfirmed:
      "De aanbieder heeft interesse bevestigd. Gebruik de contactgegevens hieronder, of wacht tot Shepherds Oud Care u verbindt.",
    referralNextPaid: "Plaatsing is vastgelegd. Blijf in contact via de gegevens hieronder.",
    referralNextDeclined: "Deze introductie is afgesloten. U kunt via de directory een andere aanbieder aanvragen.",
    referralContactHeading: "Contact",
    statusNotStarted: "Niet gestart",
    statusInProgress: "Bezig",
    statusDone: "Klaar",
    checklistAllDone: "Alle stappen klaar — tik om te bekijken"
  },
  task: {
    openOfficial: "Open officiële bron",
    markDone: "Markeer als gedaan",
    markInProgress: "Markeer als bezig",
    deadline: "Deadline",
    back: "Terug naar volgende stappen"
  },
  directory: {
    title: "Zorgaanbieders in Haaglanden",
    subtitle: "Bekijk lokale thuiszorg en woonzorglocaties in Den Haag / Haaglanden.",
    filters: "Filters",
    filterType: "Zorgtype",
    filterMunicipality: "Gemeente",
    typeAll: "Alle types",
    typeHomeCare: "Thuiszorg",
    typeResidential: "Woonzorg",
    municipalityAll: "Heel Haaglanden",
    details: "Bekijk details",
    back: "Terug naar directory",
    languages: "Talen",
    funding: "Financiering",
    website: "Website",
    contact: "Vraag een introductie aan",
    contacting: "Versturen…",
    contacted:
      "Introductie aangevraagd. U ziet deze nu onder Uw introducties op uw dashboard.",
    contactDone: "Introductie aangevraagd",
    contactFailed: "Introductie aanvragen mislukt. Probeer het opnieuw.",
    browseOnlyTitle: "U bekijkt de directory zonder zorgzaak",
    browseOnlyBody:
      "U mag lijsten altijd bekijken. Om een introductie te vragen, rond eerst de triage af en open de directory vanuit uw dashboard.",
    browseOnlyCtaDashboard: "Naar mijn dashboard",
    browseOnlyCtaTriage: "Start triage",
    readyToContact: "Dit verzoek wordt gekoppeld aan uw huidige zorgzaak.",
    needLogin: "Log in om een introductie voor uw zorgzaak aan te vragen.",
    needLoginCta: "Inloggen",
    empty: "Geen aanbieders voor deze filters.",
    loadError: "Directory laden mislukt. Vernieuw de pagina en probeer opnieuw.",
    loadDetailError: "Deze aanbieder laden mislukt. Ga terug en probeer opnieuw."
  },
  settings: {
    title: "Instellingen",
    back: "Terug naar volgende stappen",
    language: "Taal",
    notifications: "Deadlineherinneringen",
    notificationsHint:
      "Herinneringen bevatten nooit patiëntnamen of gezondheidsdetails — alleen een korte tip om uw dashboard te openen.",
    enablePush: "Herinneringen aanzetten",
    disablePush: "Herinneringen uitzetten",
    pushUnsupported: "Herinneringen worden niet ondersteund in deze browser.",
    pushDenied: "Meldingen zijn geweigerd. U kunt dit aanzetten in de browserinstellingen.",
    pushUnavailable:
      "Herinneringen zijn op deze site nog niet volledig ingesteld. U kunt checklist-deadlines hier wel blijven gebruiken.",
    pushSaved: "Herinneringen aangezet.",
    pushSaveFailed: "Herinneringsinstellingen opslaan mislukt. Probeer het opnieuw.",
    consent: "Toestemming & gekoppelde rollen"
  },
  partner: {
    title: "Bevestig een plaatsing",
    intro: "Bevestig dat een doorverwezen familie een plaatsing werd, zodat de succesfee-status kan worden bijgewerkt.",
    confirm: "Bevestig plaatsing",
    empty: "Geen openstaande doorverwijzingen."
  }
} as const;

export type CrisisV2Ui = {
  aiDisclosure: string;
  facilityPayDisclosure: string;
  digidHonesty: string;
  landing: {
    eyebrow: string;
    title: string;
    intro: string;
    cta: string;
    directoryCta: string;
  };
  triage: {
    progress: (current: number, total: number) => string;
    back: string;
    continue: string;
    seeResult: string;
  };
  result: {
    title: string;
    reasoningTitle: string;
    nextCta: string;
    homeCare: string;
    facility: string;
    both: string;
    undecided: string;
  };
  signup: {
    title: string;
    intro: string;
    continueLogin: string;
  };
  patient: {
    title: string;
    selfAttest: string;
    legalRep: string;
    inviteLater: string;
    save: string;
  };
  dashboard: {
    title: string;
    empty: string;
    directory: string;
    settings: string;
    stepsHeading: string;
    introductionsHeading: string;
    introductionsEmpty: string;
    introductionsEmptyCta: string;
    referralRequested: string;
    referralConfirmed: string;
    referralPaid: string;
    referralDeclined: string;
    referralNextRequested: string;
    referralNextConfirmed: string;
    referralNextPaid: string;
    referralNextDeclined: string;
    referralContactHeading: string;
    statusNotStarted: string;
    statusInProgress: string;
    statusDone: string;
    checklistAllDone: string;
  };
  task: {
    openOfficial: string;
    markDone: string;
    markInProgress: string;
    deadline: string;
    back: string;
  };
  directory: {
    title: string;
    subtitle: string;
    filters: string;
    filterType: string;
    filterMunicipality: string;
    typeAll: string;
    typeHomeCare: string;
    typeResidential: string;
    municipalityAll: string;
    details: string;
    back: string;
    languages: string;
    funding: string;
    website: string;
    contact: string;
    contacting: string;
    contacted: string;
    contactDone: string;
    contactFailed: string;
    browseOnlyTitle: string;
    browseOnlyBody: string;
    browseOnlyCtaDashboard: string;
    browseOnlyCtaTriage: string;
    readyToContact: string;
    needLogin: string;
    needLoginCta: string;
    empty: string;
    loadError: string;
    loadDetailError: string;
  };
  settings: {
    title: string;
    back: string;
    language: string;
    notifications: string;
    notificationsHint: string;
    enablePush: string;
    disablePush: string;
    pushUnsupported: string;
    pushDenied: string;
    pushUnavailable: string;
    pushSaved: string;
    pushSaveFailed: string;
    consent: string;
  };
  partner: {
    title: string;
    intro: string;
    confirm: string;
    empty: string;
  };
};

export function crisisV2Ui(locale: Locale): CrisisV2Ui {
  return locale === "en" ? en : nl;
}
