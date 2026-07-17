/**
 * Dutch-first product UI copy.
 * Stored option values and intake form keys stay English; use label helpers for display.
 */

import { brand, brandFounderRole, brandRegionNote, brandRegionPrimary } from "@/lib/config/brand";

export function optionLabelNl(value: string): string {
  return OPTION_LABELS_NL[value] ?? value;
}

/** English field label (fieldKeyFor source) → Dutch UI label */
export function fieldLabelNl(englishLabel: string): string {
  return FIELD_LABELS_NL[englishLabel] ?? englishLabel;
}

export function formatOptionalLabelNl(englishLabel: string, optional?: boolean): string {
  const base = fieldLabelNl(englishLabel);
  return optional ? `${base} (optioneel)` : base;
}

const OPTION_LABELS_NL: Record<string, string> = {
  // Relationships / other
  Other: "Anders",
  Self: "Zelf",
  Child: "Kind",
  "Spouse or partner": "Partner / echtgenoot",
  Sibling: "Broer of zus",
  "Other family member": "Ander familielid",
  "Professional caregiver": "Professionele zorgverlener",
  "Legal representative": "Wettelijk vertegenwoordiger",
  "Shared family decision": "Gezamenlijke familiebeslissing",

  // Yes / no
  Yes: "Ja",
  No: "Nee",
  Unsure: "Weet niet",

  // Risks
  Wandering: "Dwalen",
  Falling: "Vallen",
  Violence: "Geweld",
  Neglect: "Verwaarlozing",

  // Age
  "Under 18": "Jonger dan 18",
  "18-39": "18–39",
  "40-59": "40–59",
  "60-69": "60–69",
  "70-79": "70–79",
  "80-89": "80–89",
  "90 and above": "90 en ouder",

  // Living / mobility
  "Living alone at home": "Alleen thuis wonend",
  "Living with family": "Wont bij familie",
  "In a care home already": "Al in een zorginstelling",
  "In hospital": "In het ziekenhuis",
  "Fully mobile": "Volledig mobiel",
  "Needs walking aid": "Heeft loophulpmiddel nodig",
  "Wheelchair user": "Rolstoelgebruiker",
  "Bedbound / limited mobility": "Bedlegerig / sterk beperkt mobiel",

  // Medical / dementia
  None: "Geen",
  "Occasional nursing or medical visits": "Af en toe verpleegkundige of medische zorg",
  "Regular nursing support": "Regelmatige verpleegkundige ondersteuning",
  "24-hour medical supervision": "24-uurs medisch toezicht",
  "Not sure yet": "Nog niet zeker",
  "Early memory concerns": "Vroege geheugenklachten",
  "Moderate dementia": "Matige dementie",
  "Advanced dementia / memory care required": "Gevorderde dementie / geheugenzorg nodig",
  "Early stage": "Vroege fase",
  Moderate: "Matig",
  "Advanced / secure unit": "Gevorderd / gesloten afdeling",

  // Distance
  "Within 15 km / same city": "Binnen 15 km / dezelfde stad",
  "Within 30 minutes travel": "Binnen 30 minuten reizen",
  "Same province or region": "Zelfde provincie of regio",
  "Anywhere in the Netherlands": "Overal in Nederland",

  // Care types
  "Assisted living": "Aanleunwonen / verzorgd wonen",
  "Home care": "Thuiszorg",
  "Dementia / memory care": "Dementie / geheugenzorg",
  "Nursing care": "Verpleegzorg",
  Rehabilitation: "Revalidatie",
  "Palliative care": "Palliatieve zorg",
  "Respite care": "Respijtzorg / logeeropvang",
  "Day activities": "Dagbesteding",
  "Night care": "Nachtzorg",
  "Household support": "Huishoudelijke hulp",
  Companionship: "Gezelschap / begeleiding",
  "Nursing home": "Verpleeghuis",
  "Home care agency": "Thuiszorgorganisatie",
  "Respite / short stay": "Respijt / kort verblijf",
  "Other care facility": "Andere zorglocatie",

  // Urgency / timeline
  "Within 1 week": "Binnen 1 week",
  "Within 1 month": "Binnen 1 maand",
  "1-3 months": "1–3 maanden",
  "No set timeline": "Geen vaste planning",
  "As soon as possible": "Zo snel mogelijk",
  "3-6 months": "3–6 maanden",
  "Exploring options, no fixed date": "Aan het oriënteren, geen vaste datum",

  // Functional needs
  Mobility: "Mobiliteit",
  Transfers: "Transfers",
  Toileting: "Toiletgang",
  Bathing: "Wassen",
  Eating: "Eten",
  "Medication support": "Medicatieondersteuning",
  "Cognitive condition": "Cognitieve aandoening",
  "Behavioural concerns": "Gedragsproblemen",
  "Wandering risk": "Dwaalrisico",
  "Fall risk": "Valrisico",
  "Medical equipment": "Medische hulpmiddelen",
  "Two-person assistance": "Tweehulp",

  // Placement prefs
  "Private room": "Eigen kamer",
  "Shared room": "Gedeelde kamer",
  "Cultural or religious preferences": "Culturele of religieuze voorkeuren",
  "Couples placement": "Plaatsing als stel",
  "Pet accommodation": "Huisdieren toegestaan",
  "Smoking policy": "Rookbeleid",
  "Outdoor access": "Buitenruimte",
  "Gender preference for caregivers": "Voorkeur geslacht zorgverleners",
  "Dietary requirements": "Dieetwensen",

  // Decision responsibilities
  Financial: "Financieel",
  Medical: "Medisch",
  "Daily care": "Dagelijkse zorg",
  "Legal / power of attorney": "Juridisch / volmacht",
  "Placement decisions": "Plaatsingsbeslissingen",

  // Funding
  "Wlz indication": "Wlz-indicatie",
  "Wmo support": "Wmo-ondersteuning",
  "Zvw-funded care": "Zvw-gefinancierde zorg",
  PGB: "PGB",
  "Private funding": "Particuliere financiering",
  "Application in progress": "Aanvraag loopt",
  "No funding information yet": "Nog geen financieringsinformatie",
  "WLZ funded": "Wlz-gefinancierd",
  "Private pay": "Particulier",
  "Combination WLZ + private": "Combinatie Wlz + particulier",
  "Insurance / other": "Verzekering / anders",

  // Budget
  "Under EUR 1,500": "Onder € 1.500",
  "EUR 1,500 - EUR 2,500": "€ 1.500 – € 2.500",
  "EUR 2,500 - EUR 4,000": "€ 2.500 – € 4.000",
  "EUR 4,000 - EUR 6,000": "€ 4.000 – € 6.000",
  "Above EUR 6,000": "Boven € 6.000",

  // Languages (display)
  Dutch: "Nederlands",
  English: "Engels",
  Arabic: "Arabisch",
  Turkish: "Turks",
  French: "Frans",

  // Support types
  "Help comparing options": "Hulp bij vergelijken van opties",
  "Emotional support during decisions": "Emotionele steun bij beslissingen",
  "Coordinating siblings or relatives": "Coördinatie met broers/zussen of familie",
  "Understanding funding / WLZ": "Begrijpen van financiering / Wlz",
  "Hospital discharge planning": "Ontslagplanning ziekenhuis",
  "Urgent placement guidance": "Snelle plaatsingsbegeleiding",

  // Emotional
  "Feeling overwhelmed": "Overweldigd voelen",
  "Family disagreement": "Familieoneenigheid",
  "Guilt or grief": "Schuldgevoel of rouw",
  "Need reassurance": "Behoefte aan geruststelling",
  "Need someone to explain options clearly": "Iemand die opties helder uitlegt",

  // Additional needs
  "Medical nursing": "Medische verpleging",
  "Wheelchair accessible": "Rolstoeltoegankelijk",
  "Special diet": "Speciaal dieet",
  "Spiritual / cultural care": "Spirituele / culturele zorg",
  "24-hour supervision": "24-uurs toezicht",

  // Care levels / visit / decline
  "Low care": "Lage zorgzwaarte",
  "Medium care": "Gemiddelde zorgzwaarte",
  "High care": "Hoge zorgzwaarte",
  "Specialist dementia": "Specialistische dementiezorg",
  "Nursing / 24h": "Verpleging / 24u",
  "Visits welcome": "Bezoek welkom",
  "Virtual tour available": "Virtuele rondleiding beschikbaar",
  "Callback only": "Alleen terugbellen",
  "By appointment": "Op afspraak",
  "No capacity right now": "Momenteel geen plek",
  "Care needs exceed our services": "Zorgvraag past niet bij ons aanbod",
  "Language / communication mismatch": "Taal- / communicatiemismatch",
  "Funding type not accepted": "Financieringsvorm niet geaccepteerd",
  "Geographic area not served": "Regio niet bediend",

  // Provider availability
  "Not set": "Niet ingesteld",
  "Available now": "Nu beschikbaar",
  Available: "Beschikbaar",
  "Limited availability": "Beperkte beschikbaarheid",
  Waitlist: "Wachtlijst",
  "Fully occupied": "Vol bezet",
  "Unknown / needs confirmation": "Onbekend / bevestiging nodig",
  "Contact for availability": "Neem contact op voor beschikbaarheid"
};

const FIELD_LABELS_NL: Record<string, string> = {
  "Your name": "Uw naam",
  "Email address": "E-mailadres",
  "Phone number": "Telefoonnummer",
  "Your relationship to the person needing care": "Uw relatie tot de zorgvrager",
  "Your relationship to the senior": "Uw relatie tot de zorgvrager",
  "Preferred city or province": "Gewenste plaats of provincie",
  "Is the person currently safe tonight?": "Is de persoon vannacht veilig?",
  "Is urgent medical help required?": "Is spoedeisende medische hulp nodig?",
  "Can the person remain at home tonight?": "Kan de persoon vannacht thuis blijven?",
  "Is the caregiver at risk of burnout?": "Dreigt overbelasting bij de mantelzorger?",
  "Immediate risk flags": "Acute risicofactoren",
  "Age range": "Leeftijdscategorie",
  "Current living situation": "Huidige woonsituatie",
  "Mobility level": "Mobiliteit",
  "Medical or nursing support needed": "Benodigde medische of verpleegkundige steun",
  "Dementia or memory care needs": "Dementie- of geheugenzorg",
  "Preferred distance from your location": "Gewenste afstand vanaf uw locatie",
  "Type of care needed": "Gewenst zorgtype",
  "How urgent is the care need?": "Hoe urgent is de zorgvraag?",
  "Functional needs": "Functionele zorgbehoeften",
  "Hospital discharge date (if applicable)": "Ontslagdatum ziekenhuis (indien van toepassing)",
  "Hospital discharge date": "Ontslagdatum ziekenhuis",
  "Has the person needing care agreed to this search?": "Heeft de zorgvrager ingestemd met deze zoektocht?",
  "Who else participates in care decisions?": "Wie beslist mee over de zorg?",
  "Type of support you need": "Welke steun heeft u nodig?",
  "Emotional support needs": "Emotionele ondersteuning",
  "Funding types": "Financieringsvormen",
  "Monthly budget range": "Maandelijks budget",
  "Placement preferences": "Plaatsingsvoorkeuren",
  "Preferred languages": "Voorkeurstalen",
  "Additional needs": "Extra behoeften",
  "Desired move-in timeline": "Gewenste verhuisplanning",
  "Anything else we should know?": "Nog iets dat we moeten weten?",
  Consent: "Toestemming",
  "Primary family decision-maker": "Primaire beslisser in de familie",
  "Decision-maker relationship": "Relatie van de beslisser",
  "Decision-makers": "Beslissers"
};

export const productUiNl = {
  intake: {
    stepOf: (current: number, total: number) => `Stap ${current} van ${total}`,
    back: "Terug",
    continue: "Verder",
    submit: "Intake versturen",
    update: "Aanvraag bijwerken",
    submitting: "Intake wordt verstuurd...",
    updating: "Aanvraag wordt bijgewerkt...",
    notifyingGuide: "Uw Care Guide wordt geïnformeerd...",
    selectPlaceholder: "Selecteer...",
    specifyOther: "Graag toelichten",
    addDecisionMaker: "Nog een beslisser toevoegen",
    decisionMakerName: "Naam",
    decisionMakerRelationship: "Relatie",
    decisionMakerResponsibilities: "Verantwoordelijkheden",
    decisionMakerHint: "Voeg iedereen toe die meebeslist over de zorg. Minimaal één is verplicht.",
    decisionMakerN: (n: number) => `Beslisser ${n}`,
    remove: "Verwijderen",
    nameExample: "bijv. Maria van den Berg",
    describeRole: "Beschrijf de rol van de beslisser",
    consentRequired: "Bevestig de toestemmingsverklaring voordat u verstuurt.",
    completeContact: "Vul eerst uw contactgegevens in.",
    completeRequired: "Rond alle verplichte stappen af voordat u verstuurt.",
    chooseUpdate: "Kies op uw dashboard de zorgaanvraag die u wilt bijwerken.",
    fixFields: "Corrigeer de gemarkeerde velden.",
    tryAgain: "Vul de gemarkeerde gegevens aan en probeer opnieuw.",
    emergencyNotified: "Uw Care Guide is geïnformeerd. Bel 112 bij acuut gevaar.",
    optionalSuffix: "(optioneel)",
    sidebarTitle: "Vertel uw situatie",
    sidebarIntro: (tagline: string) =>
      `Ongeveer 5 minuten. Een echte Care Guide beoordeelt uw dossier persoonlijk — ${tagline}`,
    sidebarUpdateIntro:
      "Werk uw bestaande zorgaanvraag bij. Uw Care Guide blijft u begeleiden bij gezamenlijke beslissingen.",
    goToDashboard: "Naar uw dashboard",
    backToDashboard: "Terug naar uw dashboard",
    backHome: "Terug naar home",
    existingRequestHint:
      "U heeft al een zorgaanvraag opgeslagen. Open uw dashboard om uw zorgreis te volgen, of ga hieronder verder om een nieuwe te starten.",
    waitlistBanner:
      "U staat op onze wachtlijst. Rond hierna uw begeleide intake af zodat een Care Guide uw situatie kan beoordelen.",
    chooseUpdateBanner: "Kies de zorgaanvraag die u wilt bijwerken.",
    openYourRequests: "Open uw aanvragen",
    statusUpdated: "Aanvraag bijgewerkt. Uw dashboard wordt geopend…",
    statusSubmitted: "Intake verstuurd. Uw dashboard wordt geopend…",
    emergencyTitle: "Bel eerst de hulpdiensten",
    emergencyLead:
      "Shepherds Oud vervangt geen spoedhulp. Als iemand nu onveilig is, bel direct 112.",
    emergencyBody:
      "Uw situatie is gemarkeerd voor een Care Guide. Zij nemen zo snel mogelijk contact op — maar spoedhulp gaat voor.",
    emergencyCall112: "Bel 112 voor politie, brandweer of ambulance",
    emergencyStay: "Blijf bij de persoon als dat veilig kan",
    emergencyFollowUp:
      "Een Care Guide beoordeelt uw gemarkeerde intake nadat de acute situatie is aangepakt",
    safetyStopTitle: "Stop — bel 112 als iemand in acuut gevaar is",
    safetyStopBody:
      "Op basis van uw antwoorden is dit geen normale zorgmatching-intake. Spoedhulp gaat voor. U kunt wel een Care Guide informeren zodat zij opvolgen nadat het acute risico is aangepakt.",
    notifyGuideCta: "Care Guide informeren (gemarkeerde intake)"
  },
  family: {
    dashboardTitle: "Familiedashboard",
    dashboardSubtitle: "Uw begeleide zorgreis",
    dashboardIntro: "Volg elke stap met uw vaste Care Guide — van intake tot nazorg.",
    allRequests: "Alle zorgaanvragen",
    updateRequest: "Aanvraag bijwerken",
    startNewRequest: "Nieuwe aanvraag",
    startIntake: "Intake starten",
    noRequestYet: "Nog geen zorgaanvraag",
    noRequestHint: "Rond de intake af om uw zorgaanvraag te starten en matching te openen.",
    questionsTitle: "Vragen voor uw team",
    needToAsk: "Iets vragen?",
    emailCareGuide: "Mail Care Guide",
    contactUs: "Neem contact op met Shepherds Oud",
    reportConcern: "Melding over plaatsing",
    caseNotFound: "We konden die zorgaanvraag niet vinden op uw account. Kies hieronder een opgeslagen aanvraag.",
    journeyTitle: "Uw begeleide zorgreis",
    journeyIntro: "Een echte Care Guide begeleidt u bij elke stap — geen anonieme directory.",
    journeyComplete: "Bedankt — deze begeleide zorgreis is afgerond.",
    complete: "Afgerond",
    stepOf: (n: number, total: number) => `Stap ${n} van ${total}`,
    viewCarePlan: "Bekijk zorgplan",
    viewMatches: "Bekijk matches",
    viewVisit: "Bekijk bezoekdetails",
    successTitle: "We hebben uw aanvraag ontvangen",
    successGuideAssigned: (name: string) =>
      `${name} is uw Care Guide en beoordeelt uw dossier persoonlijk.`,
    successGuidePending: "Er wordt spoedig een Care Guide aan u toegewezen.",
    yourReference: "Uw referentie:",
    yourJourney: "Uw zorgreis",
    resultsChoose: "Kies een zorgaanvraag",
    resultsHeading: "Uw gematchte aanbieder",
    resultsStartHere: "Waar we zouden beginnen",
    resultsOther: "Andere plekken om te bellen",
    resultsEmpty: "Uw shortlist is bijna klaar",
    resultsEmptyHint: "Rond eerst de intake af.",
    resultsLoadError: "Shortlist laden mislukt",
    refresh: "Pagina vernieuwen",
    whyMatch: "Waarom deze match:",
    careServices: "Zorg en diensten:",
    nextStep: "Volgende stap",
    estWait: "Geschatte wachttijd:",
    priceOnRequest: "Prijs op aanvraag",
    requestVisit: "Bezoek aanvragen",
    requestCallback: "Terugbelverzoek",
    visitRequested: "Bezoek aangevraagd",
    sending: "Bezig...",
    readProfile: "Lees volledig profiel",
    filterAll: "Alle opties",
    filterAvailable: "Nu beschikbaar",
    filterMemory: "Geheugenzorg",
    filterHome: "Thuiszorg",
    availabilityNote: "Beschikbaarheid onder voorbehoud van bevestiging door de aanbieder en indicatie.",
    careGuideAssigned: "Uw Care Guide — toegewezen",
    careGuideSupport: (name: string) =>
      `${name} beoordeelt uw dossier persoonlijk en begeleidt u bij beoordeling, zorgplanning, bezoeken, plaatsing en nazorg.`,
    providerUpdates: "Updates van aanbieders",
    declineRecoveryTitle: "Een aanbieder kon uw laatste verzoek niet aannemen",
    viewOtherProviders: "Andere aanbieders bekijken",
    providerResponse: "Reactie van aanbieder",
    coordinatorTitle: "Uw Care Guide coördineert de volgende stappen",
    coordinatorDesc:
      "Dit zijn updates van aanbieders die u heeft gekozen. Uw Care Guide regelt het bezoek, terugbelverzoek of de volgende beslissing met u.",
    previouslyDeclined: "Eerder afgewezen",
    viewFullShortlist: "Volledige shortlist bekijken",
    shortlistLabel: "Uw shortlist",
    matchedProvidersReady: (n: number) =>
      `${n} gematchte aanbieder${n === 1 ? "" : "s"} klaar om te bekijken`,
    shortlistDeclineHint:
      "Bekijk deze alternatieven en vraag een bezoek of terugbelverzoek aan wanneer u er klaar voor bent.",
    shortlistHint: "Bekijk opties en vraag een bezoek of terugbelverzoek aan wanneer u er klaar voor bent.",
    careFacility: "Zorglocatie",
    viewProfile: "Profiel bekijken",
    viewProvider: "Aanbieder bekijken",
    savedOnDevice: "Opgeslagen op dit apparaat",
    savedProvidersTitle: "Uw opgeslagen aanbieders",
    savedProvidersDesc:
      "Aanbieders die u heeft opgeslagen vanuit uw shortlist of profielpagina's. Lokaal opgeslagen in deze browser.",
    openProfile: "Profiel openen",
    savedTipPrefix: "Tip: sla aanbieders op vanuit uw",
    savedTipSuffix: "terwijl u opties vergelijkt.",
    helpWithGuide: (name: string) =>
      `Mail uw Care Guide, ${name}, voor updates over uw dossier. Algemene platformvragen kunt u stellen aan het Shepherds Oud-team.`,
    helpWithoutGuide: "Mail het Shepherds Oud-team als u hulp nodig heeft terwijl uw Care Guide wordt toegewezen.",
    needNewProvider: "Nieuwe aanbieder nodig?",
    contactGuideAddPrefix: "Neem contact op met uw Care Guide",
    contactGuideAddSuffix: "— zij kunnen een extra optie aan uw shortlist toevoegen.",
    contactWhileAssigningSuffix: "Een Care Guide helpt u zodra er een is toegewezen.",
    contactViaOr: "of bezoek de",
    contactViaPrefix: "Neem contact op via",
    contactPage: "contactpagina",
    intakeRequestLabel: "Uw zorgaanvraag",
    intakeRequestTitle: (name: string) => `Uw zorgaanvraag — ${name}`,
    careGuideUpdates: "Updates van uw Care Guide",
    recommendedPathway: "Aanbevolen route",
    carePlanSummary: "Samenvatting zorgplan",
    visitScheduled: "Gepland bezoek of terugbelafspraak",
    contactLocation: "Contact & locatie",
    area: "Gebied",
    reference: "Referentie",
    careNeeded: "Benodigde zorg",
    fundingLanguages: "Financiering & talen",
    preferences: "Voorkeuren",
    decisionSupport: "Beslissingsondersteuning",
    seniorAgreed: "Zorgvrager ingestemd",
    participants: "Deelnemers",
    situationNotes: "Situatie & notities",
    notes: "Notities",
    safetyCheck: "Veiligheidscheck",
    moreCount: (n: number) => `+${n} meer`,
    shortlistCount: (n: number) => `${n} aanbieder${n === 1 ? "" : "s"} op uw shortlist.`,
    savedOnAccount: "Opgeslagen op uw account — vouw een onderwerp alleen uit wanneer u de details nodig heeft.",
    journeyClosedDesc: "Bedankt — dit dossier is afgesloten. Vouw uit om de voltooide stappen te bekijken.",
    myRequests: "Mijn zorgaanvragen",
    pickRequest: "Kies een aanvraag om de zorgreis te openen.",
    requestCount: (n: number) => `${n} aanvraag${n === 1 ? "" : "en"}`,
    requestStatusActive: (active: number, history: number) => `${active} actief, ${history} afgerond`,
    requestStatusInProgress: "in behandeling",
    requestStatusClosed: "afgerond",
    noRequestsYet: "Nog geen zorgaanvragen. Start een nieuwe aanvraag om te beginnen.",
    dateUnknown: "Datum onbekend",
    careRequest: "Zorgaanvraag",
    ageLabel: (range: string) => `Leeftijd ${range}`,
    locationUnknown: "Locatie nog niet bekend",
    guidePending: "Care Guide wordt toegewezen",
    openJourney: "Open zorgreis",
    update: "Bijwerken",
    matchesPerRequest: "Matches worden per zorgaanvraag apart voorbereid.",
    completeIntakeFirst: "Rond eerst de intake af",
    completeIntakeDesc: "Vertel ons over uw situatie zodat uw Care Guide aanbiedermatches kan voorbereiden.",
    loadErrorDesc: "Controleer uw verbinding en vernieuw de pagina. Uw zorgaanvraag blijft opgeslagen op dit apparaat.",
    matchedEmptyDesc:
      "Uw Care Guide heeft passende aanbieders gematcht. Als er binnen een dag niets verschijnt, neem contact op met uw Care Guide met uw referentienummer.",
    carePlanReady: "Uw zorgplan is klaar",
    carePlanReadyDesc: "Uw Care Guide rondt de aanbiedermatches voor uw shortlist af.",
    assessmentInProgress: "Uw Care Guide rondt uw beoordeling af",
    assessmentInProgressDesc: "Zodra de beoordeling klaar is, publiceren we hier uw zorgplan en passende aanbieders.",
    guideReviewing: "Uw Care Guide beoordeelt uw dossier",
    guideReviewingDesc: "Een echte persoon bekijkt uw intake voordat de beoordeling begint.",
    preparingJourney: "We bereiden uw zorgreis voor",
    preparingJourneyDesc: "Uw Care Guide beoordeelt uw aanvraag en start binnenkort uw beoordeling.",
    matchNotReady: "Deze match is nog niet klaar voor verzoeken. Kom terug nadat uw Care Guide uw beoordeling heeft afgerond.",
    visitSentFor: (name: string) => `Bezoekverzoek verstuurd voor ${name}.`,
    callbackSentFor: (name: string) => `Terugbelverzoek verstuurd voor ${name}.`,
    historyCaseNote: "Deze aanvraag is afgesloten. Matches worden alleen ter inzage getoond.",
    availabilityConfirmed: (date: string) => `Beschikbaarheid bevestigd ${date}`,
    servicesLanguages: "Diensten en talen:",
    languages: "Talen:",
    fundingAccepted: "Financiering geaccepteerd:",
    funding: "Financiering:",
    roomTypes: "Kamertypes:",
    quality: "Kwaliteit:",
    accessibility: "Toegankelijkheid:",
    contactExpectation: "Contactverwachting:",
    respondsWithin: (hours: number) => `Reageert doorgaans binnen ${hours} uur`,
    historyNextStep: "Deze aanvraag is afgesloten. Bekijk hieronder de eindstatus per aanbieder.",
    requestVisitOrCallback: "Vraag een bezoek of terugbelverzoek aan; ons team helpt coördineren met de locatie.",
    callbackSent: "Terugbelverzoek verstuurd",
    visitSent: "Bezoek verstuurd",
    profile: "Profiel",
    otherProvidersTip: "Het helpt om één of twee alternatieven te hebben voordat u beslist.",
    shownOf: (shown: number, total: number) => `${shown} van ${total} getoond`,
    noFilterMatch: (filter: string, all: string) =>
      `Geen andere aanbieders passen bij "${filter}". Probeer "${all}" voor uw volledige shortlist.`,
    rooms: "Kamers:",
    switchCase: "Wissel van zorgaanvraag",
    reportConcernSubject: "Melding over plaatsing",
    reportConcernBody: (id: string) =>
      `Hallo Shepherds Oud,\n\nIk wil een melding doen over een plaatsing voor zorgaanvraag ${id}.\n\n`,
    providerDetail: {
      completeIntakeFirst: "Rond eerst de intake af zodat we uw verzoek aan deze aanbieder kunnen koppelen.",
      notMatchedYet: "Deze aanbieder is nog niet aan uw aanvraag gekoppeld. Uw Care Guide publiceert eerst matches.",
      savedOnDevice: (name: string) =>
        `${name} opgeslagen op dit apparaat. Vind ze onder Opgeslagen aanbieders op uw dashboard.`,
      removedFromSaved: (name: string) => `${name} verwijderd uit uw opgeslagen aanbieders.`,
      completeIntakeForRequests: "Rond uw intake af om bezoeken of terugbelverzoeken aan te vragen bij gematchte aanbieders.",
      chooseRequestFirst: "Kies eerst een zorgaanvraag en open deze aanbieder vanuit de matches van die aanvraag.",
      caseNotFoundOnAccount:
        "We konden die zorgaanvraag niet vinden op uw account. Open deze aanbieder vanuit een van uw opgeslagen aanvragen.",
      matchNotPublished:
        "Contactverzoeken openen zodra uw Care Guide deze aanbieder aan uw intake heeft gekoppeld.",
      chooseAnotherProvider: "Kies een andere gematchte aanbieder op uw dashboard.",
      statusLabel: (status: string) => `Status: ${status}.`,
      backToDashboard: "Terug naar uw dashboard",
      backToMatches: "Terug naar alle matches",
      yourDashboard: "Uw dashboard",
      savingFavourite: "Opslaan...",
      savedToFavourites: "Opgeslagen als favoriet",
      saveToFavourites: "Opslaan als favoriet",
      sendingVisitRequest: "Bezoekverzoek versturen...",
      sendingCallbackRequest: "Terugbelverzoek versturen...",
      callbackRequested: "Terugbelverzoek verstuurd",
      chooseCareRequest: "Kies zorgaanvraag",
      careAndServices: "Zorg en diensten",
      languagesHeading: "Talen",
      keyDetails: "Belangrijkste gegevens",
      contactAndNextSteps: "Contact en vervolgstappen"
    }
  },
  provider: {
    dashboardTitle: "Aanbiedersdashboard",
    inquiries: "Familieaanvragen",
    inquiriesIntro: "Bekijk gematchte families, accepteer of wijs af, en houd beschikbaarheid bij.",
    availableBeds: "Beschikbare bedden",
    actionNeeded: "Actie nodig",
    availability: "Beschikbaarheid",
    profileStatus: "Profielstatus",
    locked: "Vergrendeld",
    complete: "Compleet",
    completeProfile: "Rond uw locatieprofiel af om aanvragen te ontvangen",
    openProfile: "Open locatieprofiel",
    noInquiries: "Nog geen aanvragen",
    noInquiriesHint: "Rond uw profiel af om zorgaanvragen te ontvangen.",
    acceptVisit: "Bezoek accepteren",
    decline: "Afwijzen",
    familyDetails: "Familiegegevens",
    whatNext: "Wat gebeurt er nu",
    facilityProfile: "Locatieprofiel & beschikbaarheid",
    saveProfile: "Locatieprofiel opslaan",
    facilityDetails: "Locatiegegevens",
    careProfile: "Zorgprofiel",
    pricingResponse: "Prijs & reactie",
    declineTitle: "Deze aanvraag afwijzen?",
    declineConfirm: "Aanvraag afwijzen",
    tabNew: "Nieuw",
    tabOngoing: "Lopend",
    tabClosed: "Afgesloten",
    tabAll: "Alles",
    requestFailed: "Verzoek mislukt.",
    dashboardRefreshed: "Uw dashboard is bijgewerkt.",
    refreshFailed: "Dashboard vernieuwen mislukt.",
    loadFailed: "Aanbiedersdashboard laden mislukt.",
    nameMinLength: "Locatienaam moet minimaal 2 tekens bevatten.",
    bedsTotalInvalid: "Totaal aantal bedden moet een geheel getal zijn (0 of meer).",
    bedsOpenInvalid: "Beschikbare bedden moeten een geheel getal zijn (0 of meer).",
    responseTimeInvalid: "Reactietijd moet een geheel aantal uren zijn.",
    profileReadFailed: "Opgeslagen locatieprofiel kon niet worden gelezen.",
    profileSavedComplete: "Locatieprofiel opgeslagen. U kunt nu zorgaanvragen ontvangen.",
    profileSavedIncomplete:
      "Locatieprofiel opgeslagen. Rond de resterende items af om zorgaanvragen te ontvangen.",
    profileSaveFailed: "Locatieprofiel opslaan mislukt. Controleer uw verbinding en probeer opnieuw.",
    inquiryUpdateFailed: "Deze aanvraag bijwerken mislukt. Probeer opnieuw.",
    inquiryUpdateConnectionFailed:
      "Deze aanvraag bijwerken mislukt. Controleer uw verbinding en probeer opnieuw.",
    facilityProfileButton: "Locatieprofiel",
    profileItemsNeededAria: (n: number) =>
      `${n} profielitem${n === 1 ? "" : "s"} nog nodig`,
    missingCount: (n: number) => `${n} ontbrekend`,
    profileLockHint:
      "Zorgaanvragen blijven vergrendeld totdat uw profiel en beschikbaarheid klaar zijn voor families en Care Guides.",
    inquiryQueue: "Aanvragenwachtrij",
    inquiryQueueIntro:
      "Open een aanvraag om details te bekijken, verzoeken te accepteren of af te wijzen, en updates van uw Care Guide te volgen.",
    inquiryCountInTab: (count: number, tabLabel: string) => `${count} in ${tabLabel}`,
    searchPlaceholder: "Zoek op familienaam, gebied of referentie…",
    emptyProfileDescription:
      "Open uw locatieprofiel om contactgegevens, diensten, zorgniveaus en beschikbaarheid toe te voegen.",
    noInquiriesInTab: (tabLabel: string) => `Geen ${tabLabel} aanvragen`,
    tryAnotherTab: "Probeer een ander tabblad om aanvragen in een andere fase te zien.",
    colFamily: "Familie",
    colCareNeeded: "Benodigde zorg",
    colLocation: "Locatie",
    colUpdated: "Bijgewerkt",
    colStatus: "Status",
    colActions: "Acties",
    open: "Openen",
    refLabel: "Ref",
    needHelp: "Hulp nodig van Shepherds Oud?",
    supportHint: "Platform- of profielvragen — geen familiespecifieke coördinatie.",
    emailSupport: "E-mail support",
    declineDescription:
      "Selecteer een reden. De familie en hun Care Guide zien dat uw locatie momenteel niet kan helpen.",
    declineReasonLabel: "Reden voor afwijzing",
    visitCallback: "Terugbelafspraak",
    visitOnSite: "Locatiebezoek",
    visitWithProvider: (name: string) => ` met ${name}`,
    nextStepAcceptedVisitTitle: "Bezoek of gesprek gepland",
    nextStepAcceptedVisitDesc: "Uw Care Guide heeft de volgende stap met deze familie geregeld.",
    nextStepAcceptedWaitTitle: "Geaccepteerd — wachten op Care Guide",
    nextStepAcceptedWaitDesc:
      "Er is nu geen extra actie nodig. De Care Guide regelt het bezoek of terugbelverzoek en informeert u hier.",
    nextStepContactedTitle: "Bezoek of gesprek geregeld",
    nextStepContactedDescWithVisit:
      "Bevestigd met de familie. Gebruik de details hieronder om u voor te bereiden.",
    nextStepContactedDescNoVisit:
      "De Care Guide heeft de volgende stap gecoördineerd. Let op timingdetails hier of per e-mail.",
    nextStepPlacedTitle: "Familie kiest uw locatie",
    nextStepPlacedDesc: "De familie gaat verder met uw locatie. De Care Guide coördineert de laatste details.",
    nextStepDeclinedTitle: "Eerder afgewezen",
    nextStepDeclinedDesc:
      "U heeft deze aanvraag eerder afgewezen. Als uw Care Guide deze na dossierupdates opnieuw opent, verschijnt deze weer onder Nieuw met accepteer/afwijs-acties.",
    nextStepClosedTitle: "Aanvraag afgesloten",
    nextStepClosedDesc: "Er is geen verdere actie nodig voor deze familie.",
    detailFamilyContact: "Familiecontact",
    detailPhone: "Telefoon",
    detailEmail: "E-mail",
    detailPreferredArea: "Gewenst gebied",
    detailCareNeeded: "Benodigde zorg",
    detailUrgency: "Urgentie",
    detailAgeRange: "Leeftijdscategorie",
    detailMatchScore: "Matchscore",
    detailStatus: "Status",
    detailReceived: "Ontvangen",
    detailLastUpdated: "Laatst bijgewerkt",
    detailVisitOrPhone: "Bezoek of telefoon",
    detailActivity: "Activiteit",
    inquiryTitleFallback: "Familieaanvraag",
    inquiryDetailsSubtitle: "Aanvraagdetails",
    accepting: "Accepteren...",
    declining: "Afwijzen...",
    footerAccepted: "Geaccepteerd — uw Care Guide coördineert de volgende stappen.",
    footerContacted: "Bezoek of gesprek gecoördineerd — let op timingdetails hier of per e-mail.",
    footerPlaced: "Plaatsing loopt voor deze familie.",
    footerDeclined: "U heeft deze aanvraag afgewezen.",
    footerClosed: "Deze aanvraag is afgesloten.",
    footerNoAction: "Geen actie nodig op dit moment.",
    profileSubtitleComplete: "Werk bij hoe uw locatie zichtbaar is voor families en Care Guides.",
    profileSubtitleIncomplete: (n: number) =>
      `${n} item${n === 1 ? "" : "s"} nog nodig voordat aanvragen ontgrendelen.`,
    saving: "Opslaan...",
    createProfile: "Locatieprofiel aanmaken",
    availabilitySectionDesc: "Houd bedden en status actueel zodat families accurate capaciteit zien.",
    notSetPlaceholder: "Niet ingesteld",
    availabilityStatusLabel: "Beschikbaarheidsstatus",
    totalBedsLabel: "Totaal aantal bedden of plaatsen",
    optionalPlaceholder: "Optioneel",
    facilityDetailsDesc: "Kerngegevens die families en Care Guides gebruiken om fit te beoordelen.",
    facilityNameLabel: "Naam locatie *",
    facilityTypeLabel: "Type locatie",
    contactPersonLabel: "Contactpersoon",
    cityLabel: "Plaats",
    cityPlaceholder: "bijv. Utrecht",
    provinceLabel: "Provincie",
    descriptionLabel: "Beschrijving locatie",
    descriptionPlaceholder: "Beschrijf uw zorgaanpak, omgeving en specialismen.",
    careProfileDesc: "Diensten, talen en zorgniveaus die u aanbiedt.",
    servicesOfferedLabel: "Aangeboden diensten",
    careLevelsLabel: "Zorgniveaus",
    languagesSpokenLabel: "Gesproken talen",
    dementiaCapacityLabel: "Dementiecapaciteit",
    visitAvailabilityLabel: "Bezoekbeschikbaarheid",
    pricingSectionDesc: "Optionele details die families helpen opties te vergelijken.",
    typicalResponseLabel: "Typische reactietijd (uren)",
    priceMinLabel: "Maandprijs min (EUR)",
    priceMaxLabel: "Maandprijs max (EUR)",
    fundingAcceptedLabel: "Geaccepteerde financieringsvormen",
    stillNeededForInquiries: "Nog nodig voor aanvragen",
    exampleResponsePlaceholder: "bijv. 24",
    feedbackErrorPrefixes: ["Kon", "Deze aanvraag", "Verzoek"]
  },
  auth: {
    emailLabel: "E-mailadres",
    emailLink: "Stuur mij een inloglink",
    sendingLink: "Link wordt verstuurd...",
    continueGoogle: "Doorgaan met Google",
    redirectingGoogle: "Doorsturen naar Google…",
    or: "of",
    invalidLink: "Die inloglink is ongeldig of verlopen. Vraag een nieuwe link aan.",
    invalidEmail: "Voer een geldig e-mailadres in.",
    sendFailed: "Inloglink versturen mislukt.",
    linkSent: (email: string) =>
      `Inloglink verstuurd naar ${email}. Open deze binnen 15 minuten op dit apparaat.`,
    providerInviteHint: "Gebruik het uitgenodigde e-mailadres van de locatie om onboarding af te ronden.",
    adminOnly: "Administratortoegang is beperkt tot goedgekeurde Care Guide-accounts.",
    familyLabel: "Voor zorgzoekers",
    familyTitle: "Log in op uw zorgdashboard",
    familyIntro: "Gebruik e-mail of Google om uw aanvraag, updates van uw Care Guide en matches te bekijken.",
    familyCta: "Intake afronden",
    familyStarting: "Nieuwe aanvraag starten?",
    loadingSignIn: "Inloggen laden...",
    providerLabel: "Voor zorglocaties",
    providerTitle: "Vermeld uw locatie op Shepherds Oud",
    providerIntro: "Log in met uw werk-e-mail of Google om profiel, beschikbaarheid en familieaanvragen te beheren.",
    providerWaitlist: "Meld u aan op de aanbiederswachtlijst",
    providerNotReady: "Nog niet klaar om te vermelden?",
    backHome: "Terug naar home",
    adminLabel: "Care Guide-login",
    adminTitle: "Inloggen bij Shepherds Oud",
    adminIntro: "Gebruik uw goedgekeurde Google-account voor het Care Guide-dashboard.",
    providerAccountNeeded:
      "U heeft een zorglocatie-account nodig voor deze pagina. Gebruik Vermeld uw locatie om in te loggen.",
    oauthNotConfigured:
      "Google-inloggen is nog niet geconfigureerd. Voeg GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET toe in Vercel en deploy opnieuw.",
    oauthFailed: "Google-inloggen kon niet worden voltooid. Probeer opnieuw of neem contact op met support.",
    providerNotApproved: "Uw locatie-account is nog niet goedgekeurd.",
    workEmailHint: "Gebruik uw werk-e-mail — Gmail, Microsoft, Apple of uw eigen domein.",
    providerAccountNotFound:
      "Er is geen locatie-account gevonden voor dit e-mailadres. Meld u aan op de aanbiederswachtlijst — zodra Shepherds Oud u uitnodigt, kunt u hier inloggen.",
    providerInvitePending:
      "U heeft een openstaande uitnodiging. Open eerst de uitnodigingslink uit uw Shepherds Oud-e-mail om te accepteren, daarna kunt u hier inloggen.",
    providerInviteExpired:
      "Deze uitnodigingslink is verlopen. Neem contact op met Shepherds Oud support voor een nieuwe uitnodiging.",
    providerInviteEmailMismatch:
      "Deze uitnodiging hoort bij een ander e-mailadres. Log in met het e-mailadres uit uw Shepherds Oud-uitnodiging."
  },
  matchScore: {
    strongMatch: "Sterke match voor uw situatie",
    goodOption: "Goede optie om te verkennen",
    worthConversation: "Het gesprek waard",
    percentAlignment: (score: number) => `${score}% match`,
    percentFitAria: (score: number) => `${score} procent match`
  },
  userMenu: {
    loadingAccount: "Account laden...",
    loading: "Laden...",
    careFacilities: "Zorglocaties",
    prelaunchProviderHint:
      "Inloggen voor aanbieders opent bij lancering. Meld uw interesse nu aan; wij nemen contact op zodra onboarding klaar is.",
    registerFacility: "Meld uw locatie aan",
    yourAccount: "Uw account",
    providerSignInHint: "Log in als zorglocatie om profiel, beschikbaarheid en aanvragen te beheren.",
    facilitySignIn: "Inloggen als zorglocatie",
    accountFallback: "Account",
    openDashboard: "Open dashboard",
    signingOut: "Uitloggen...",
    signOut: "Uitloggen",
    openProfileMenu: "Profielmenu openen",
    getStarted: "Aan de slag",
    roleAdmin: "Beheerder",
    roleProvider: "Zorgaanbieder",
    roleFamily: "Familieaccount"
  },
  waitlist: {
    facilityName: "Naam locatie",
    contactPerson: "Contactpersoon",
    yourName: "Uw naam",
    email: "E-mailadres",
    phone: "Telefoonnummer",
    city: "Plaats",
    province: "Provincie",
    cityPlaceholder: "bijv. Den Haag",
    relationship: "Relatie tot de zorgvrager",
    relationshipPlaceholder: "Zelf, kind, partner, enz.",
    ageRange: "Leeftijdscategorie",
    agePlaceholder: "Selecteer leeftijd",
    careTypes: "Gewenst zorgtype",
    facilityType: "Type locatie",
    registrationNumber: "KvK- of registratienummer",
    registrationPlaceholder: "bijv. 12345678",
    registrationHint: "Voor verificatie vóór onboarding. Wij controleren dit handmatig.",
    bedsOptional: "Aantal bedden of plaatsen (optioneel)",
    services: "Aangeboden zorg",
    message: "Nog iets dat we moeten weten?",
    messagePlaceholder: "Vertel kort over uw situatie of locatie.",
    submit: "Aanmelden",
    submitting: "Bezig met verzenden...",
    fixFields: "Corrigeer de gemarkeerde velden.",
    saveFailed: "Registratie opslaan mislukt. Probeer het opnieuw."
  },
  validation: {
    required: "Verplicht",
    tooShort: "Te kort",
    invalidEmail: "Ongeldig e-mailadres",
    consentRequired: "Bevestig de toestemmingsverklaring voordat u uw zorgaanvraag verstuurt.",
    selectCareType: "Selecteer minstens één zorgtype",
    addDecisionMaker: "Voeg minstens één beslisser toe",
    nameRequired: "Naam is verplicht",
    relationshipRequired: "Relatie is verplicht",
    registrationNumber: "Vul uw KvK- of overheidsregistratienummer in",
    facilityNameMin: "Locatienaam moet minstens 2 tekens zijn.",
    bedsWhole: "Aantal bedden moet een geheel getal zijn (0 of meer).",
    bedsNegative: "Aantal bedden mag niet negatief zijn.",
    bedsOpenWhole: "Beschikbare bedden moeten een geheel getal zijn (0 of meer).",
    bedsOpenNegative: "Beschikbare bedden mogen niet negatief zijn.",
    responseTimeWhole: "Reactietijd moet een geheel aantal uren zijn.",
    responseTimeMin: "Reactietijd moet minstens 1 uur zijn.",
    responseTimeMax: "Reactietijd mag maximaal 168 uur (1 week) zijn.",
    priceMinNegative: "Minimumprijs mag niet negatief zijn.",
    priceMaxNegative: "Maximumprijs mag niet negatief zijn."
  },
  nav: {
    home: "Home",
    waitlist: "Wachtlijst",
    forFamilies: "Voor families",
    forProviders: "Voor aanbieders",
    faq: "Veelgestelde vragen",
    forInternationals: "Voor internationals",
    contact: "Contact",
    startIntake: "Intake starten",
    howItWorks: "Hoe het werkt",
    about: "Over ons",
    call: "Bellen",
    openMenu: "Menu openen",
    mainMenu: "Hoofdmenu",
    myFacility: "Mijn locatie",
    adminPanel: "Beheer",
    viewSite: "Naar website",
    adminMenu: "Beheermenu"
  },
  footer: {
    navAria: "Footer navigatie",
    legal: "Juridisch",
    legalAria: "Juridisch",
    prelaunchBlurb: (regionNote: string) =>
      `Begeleide zorgnavigatie wanneer thuis wonen niet meer gaat. ${regionNote} Meld u nu aan.`,
    liveBlurb: (regionPrimary: string) =>
      `Begeleide zorgnavigatie — geen directory. Care Guide, matching en nazorg in ${regionPrimary}.`,
    copyrightSuffix: "Zorgnavigatie in Nederland.",
    prelaunchStatus: "Pre-launch — begeleide intake opent binnenkort",
    liveStatus: "Voor families en zorgaanbieders.",
    legalLabel: (href: string, fallback: string) =>
      (
        {
          "/privacy": "Privacybeleid",
          "/terms": "Voorwaarden",
          "/cookies": "Cookiebeleid",
          "/complaints": "Klachten",
          "/data-deletion": "Gegevens wissen",
          "/accessibility": "Toegankelijkheid",
          "/company": "Bedrijfsgegevens"
        } as Record<string, string>
      )[href] || fallback
  },
  common: {
    families: "Families",
    careProviders: "Zorgaanbieders",
    registerInterest: "Interest registreren",
    startIntake: "Intake starten",
    pricingTerms: "Prijzen & voorwaarden",
    registerLocation: "Locatie registreren",
    backHome: "Terug naar home",
    readMore: "Meer lezen:",
    email: "E-mail",
    waitlist: "Wachtlijst",
    familyWaitlist: "Familiewachtlijst",
    providerWaitlist: "Aanbiederswachtlijst",
    earlyRegistration: "Vroege aanmelding",
    mailPrefix: "Mail"
  },
  pages: {
    about: {
      metaTitle: `Over ons | ${brand.name}`,
      metaDescription:
        "Begeleide zorgnavigatie wanneer thuis wonen niet meer gaat — Care Guide, matching en nazorg in regio Den Haag / Haaglanden.",
      label: "Over ons",
      title: "Zorgnavigatie met een menselijke gids",
      intro: `${brand.name} helpt families wanneer thuis wonen niet meer gaat — bij dementie, na ziekenhuis, of wanneer thuiszorg niet meer volstaat. Wij zijn geen directory. Elke reis begint met een Care Guide die luistert, beoordeelt en coördineert met passende aanbieders.`,
      sections: [
        {
          title: "Voor wie",
          paragraphs: [
            "Voor volwassen kinderen en families die een volgende stap zoeken: verpleeghuis, zorgvilla, of meer intensieve ondersteuning thuis. Ook wanneer de persoon nog mobiel is — dementie vraagt vaak andere zorg dan alleen loopvermogen.",
            "Families melden zich vaak als besluiten urgent, verwarrend of emotioneel zwaar voelen. Wij blijven meelopen van eerste intake tot plaatsing en nazorg op 7, 30 en 90 dagen."
          ]
        },
        {
          title: "Wat ons anders maakt",
          list: [
            "Een begeleide reis — geen gids of eindeloze zoeklijst",
            "Gratis voor families; transparant betaald door deelnemende aanbieders",
            "Eén vaste Care Guide van intake tot nazorg",
            "Regio-focus: Den Haag / Haaglanden, daarna landelijk",
            "Hulp bij Nederlandse begrippen: Wlz, Wmo, CIZ, PGB, eigen bijdrage, zorgkantoor"
          ],
          paragraphs: [] as string[]
        },
        {
          title: `Uw Care Guide: ${brand.founderName}`,
          paragraphs: [
            `${brand.founderName} (${brandFounderRole("nl")}) bouwde Shepherds Oud omdat families in crisis verdwalen tussen directories en papieren. Begeleiding door zorgprofessionals die het Nederlandse stelsel kennen — van CIZ-aanvraag tot keuze tussen thuiszorg, zorgvilla of verpleeghuis.`,
            brandRegionNote("nl")
          ]
        }
      ],
      cta: "Hoe het werkt"
    },
    howItWorks: {
      metaTitle: `Hoe het werkt | ${brand.name}`,
      metaDescription:
        "Stap voor stap: intake, Care Guide, matching, bezoeken, plaatsing en nazorg op 7, 30 en 90 dagen.",
      label: "Hoe het werkt",
      title: "Van eerste gesprek tot de juiste zorg",
      intro: `${brand.name} is een begeleide reis — geen directory. U weet altijd wat de volgende stap is en wie u helpt. ${brandRegionNote("nl")}`,
      sections: [
        {
          title: "1. Vertel uw situatie",
          paragraphs: [
            "Rond de begeleide intake af in ongeveer 10–15 minuten: wie zorg nodig heeft, dementie of zorgbehoefte, urgentie, budget (Wlz / Wmo / PGB), taal en wie meebeslist.",
            "U kunt tussentijds opslaan en later verdergaan wanneer u bent ingelogd."
          ]
        },
        {
          title: "2. Ontmoet uw Care Guide",
          paragraphs: [
            "Een Care Guide belt binnen 24 uur, beoordeelt uw dossier en helpt doelen, budget en praktische randvoorwaarden (afstand, taal, dementiecapaciteit) scherp te krijgen."
          ]
        },
        {
          title: "3. Bekijk uw shortlist",
          paragraphs: [
            "Wanneer het zorgplan klaar is, ziet u gematchte aanbieders — geen eindeloze zoeklijst. Beschikbaarheid en wachttijd waar bekend, plus de mogelijkheid om favorieten te bewaren."
          ]
        },
        {
          title: "4. Bezoeken, plaatsing en nazorg",
          paragraphs: [
            "Uw Care Guide coördineert bezoeken of terugbelafspraken. Statusupdates verschijnen op uw dashboard.",
            "Na plaatsing blijven we betrokken: check-ins op 7, 30 en 90 dagen — met dezelfde Care Guide. Als een aanbieder afwijst, blijft uw dossier open."
          ]
        }
      ]
    },
    contact: {
      metaTitle: `Contact | ${brand.name}`,
      metaDescription: `Neem contact op met ${brand.name} voor begeleide zorgnavigatie in regio ${brand.regionPrimary}.`,
      label: "Contact",
      title: "Wij helpen graag",
      intro:
        "Of u zorg zoekt voor een naaste, zelf hulp nodig heeft, of een locatie wilt vermelden — bel of mail ons. Een Care Guide belt binnen 24 uur terug.",
      phoneHint: "Voor families in crisis — bel eerst als een formulier te zwaar voelt.",
      familiesPrelaunch: "Matching start bij lancering. Registreer uw interesse; wij nemen contact op.",
      familiesLive: "Start de intake online, of bel de Care Guide-lijn als u eerst wilt praten.",
      providersBlurb: "Gratis vermelden, betalen bij plaatsing. Lees de voorwaarden of registreer uw locatie.",
      emailHint: "Reactie binnen één werkdag — of sneller via de Care Guide-lijn.",
      englishPage: "Engelse pagina"
    },
    faq: {
      metaTitle: `Veelgestelde vragen | ${brand.name}`,
      metaDescription:
        "FAQ over Shepherds Oud: Wlz, Wmo, CIZ, PGB, eigen bijdrage, Care Guide, kosten voor families en nazorg.",
      label: "FAQ",
      title: "Veelgestelde vragen",
      intro:
        "Over begeleide zorgnavigatie, kosten, en Nederlandse begrippen zoals Wlz, Wmo, CIZ, PGB en eigen bijdrage.",
      internationalsLead: "International in The Hague?",
      items: [
        {
          q: "Wat is Shepherds Oud?",
          a: "Een begeleide zorgnavigatie — geen directory. U krijgt één Care Guide die helpt van intake tot plaatsing en nazorg (7, 30 en 90 dagen), wanneer thuis wonen niet meer gaat."
        },
        {
          q: "Is het gratis voor families?",
          a: "Ja. Families betalen ons niets. Shepherds Oud wordt gecompenseerd door deelnemende zorgaanbieders. Uw opties worden nooit beperkt tot alleen betalende aanbieders."
        },
        { q: "Waar zijn jullie actief?", a: brandRegionNote("nl") },
        {
          q: "Wat is het verschil met Filica of ZorgkaartNederland?",
          a: "Die platforms zijn vooral overzichten. Wij matchen, coördineren bezoeken en blijven na plaatsing betrokken. Een gids stopt bij de lijst; wij begeleiden de reis."
        },
        {
          q: "Wat is CIZ?",
          a: "Het Centrum Indicatiestelling Zorg. Voor zware, langdurige zorg (Wlz) beoordeelt CIZ of u recht heeft op een indicatie."
        },
        {
          q: "Wat is Wlz?",
          a: "De Wet langdurige zorg — voor mensen die permanent intensieve zorg nodig hebben, bijvoorbeeld in een verpleeghuis of via 24-uurs zorg thuis."
        },
        {
          q: "Wat is Wmo?",
          a: "De Wet maatschappelijke ondersteuning — gemeentelijke ondersteuning om zo lang mogelijk thuis te blijven (hulp in huis, dagbesteding, woningaanpassingen)."
        },
        {
          q: "Wat is PGB?",
          a: "Persoonsgebonden budget: u ontvangt budget om zelf zorg in te kopen, in plaats van zorg in natura via een aanbieder."
        },
        {
          q: "Wat is eigen bijdrage?",
          a: "Het deel dat u (of uw gezin) zelf bijdraagt aan Wlz- of Wmo-zorg. De hoogte hangt af van inkomen, vermogen en situatie. Wij helpen de brief te duiden; formele berekening ligt bij CAK / gemeente."
        },
        {
          q: "Wat doet het zorgkantoor?",
          a: "Het zorgkantoor contracteert Wlz-aanbieders in een regio en helpt bij het vinden van passende zorg binnen uw indicatie."
        },
        { q: "Hoe snel nemen jullie contact op?", a: "Een Care Guide belt binnen 24 uur na uw aanvraag (op werkdagen)." },
        {
          q: "Wie is mijn Care Guide?",
          a: `${brand.founderName} (${brandFounderRole("nl")}) en het team begeleiden dossiers persoonlijk. Begeleiding door zorgprofessionals die het Nederlandse stelsel kennen — geen anonieme callcenter-lijn.`
        }
      ]
    },
    providers: {
      metaTitle: `Voor zorgaanbieders | ${brand.name}`,
      metaDescription:
        "Gratis vermelden bij Shepherds Oud. Betaal alleen bij succesvolle plaatsing. Vooraf gematchte familievraagstukken in regio Den Haag / Haaglanden.",
      label: "Zorgaanbieders",
      title: "Gratis vermelden. Betalen bij plaatsing.",
      intro: `${brand.name} is geen abonnementsgids. U bent zichtbaar zonder maandelijkse listing fee. Wij verdienen alleen mee als er een succesvolle plaatsing volgt — transparant voor families én aanbieders.`,
      whatYouGetTitle: "Wat u krijgt",
      whatYouGet: [
        "Vooraf gematchte families (zorgtype, taal, dementiecapaciteit, beschikbaarheid)",
        "Dashboard om leads te accepteren, af te wijzen of op te volgen",
        `Focusregio ${brandRegionPrimary("nl")}, daarna landelijke uitbreiding`,
        "Geen eindeloze koude leads uit een open directory"
      ],
      compensationTitle: "Vergoeding",
      compensationLead:
        "Exacte plaatsingsvergoeding stemmen we af per zorgtype en regio tijdens onboarding. Het principe blijft:",
      compensationBold: " gratis zichtbaar, betalen bij resultaat",
      forFamiliesTitle: "Voor families",
      forFamilies:
        "Families betalen ons niets. Hun keuzes worden nooit beperkt tot alleen betalende aanbieders.",
      registerCta: "Registreer uw locatie"
    },
    register: {
      metaTitle: `Registreren | ${brand.name}`,
      metaDescription: `Registreer uw interesse bij ${brand.name} — voor families of zorgaanbieders.`,
      waitlistLabel: "Wachtlijst",
      registerInterestTitle: "Meld uw interesse",
      registerInterestDesc: (regionNote: string) =>
        `Nog niet klaar voor de volledige intake? Registreer uw interesse. ${regionNote}`,
      familiesPrelaunch:
        "Registreer wanneer thuis wonen niet meer gaat — bij dementie, na ziekenhuis, of wanneer thuiszorg niet meer volstaat.",
      familiesWaitlist: "Meld u op de wachtlijst, of start direct de begeleide intake.",
      providersBlurb: "Gratis vermelden, betalen bij plaatsing. Registreer uw locatie of lees eerst de voorwaarden."
    },
    registerFamily: {
      metaTitle: `Familiewachtlijst | ${brand.name}`,
      metaDescription: "Meld interesse in begeleide zorgnavigatie voor uw familie.",
      label: "Familiewachtlijst",
      title: "Meld interesse in zorgbegeleiding",
      introPrelaunch: (regionNote: string) =>
        `Vertel kort over uw situatie wanneer thuis wonen niet meer gaat. ${regionNote} Wij nemen contact op wanneer matching start.`,
      introWaitlist: (regionNote: string) =>
        `Registreer uw interesse; wij nemen contact op. Klaar voor begeleide navigatie? Start apart de intake. ${regionNote}`
    },
    registerFacility: {
      metaTitle: `Aanbiederswachtlijst | ${brand.name}`,
      metaDescription: "Registreer uw zorglocatie — gratis vermelden, betalen bij plaatsing.",
      label: "Aanbiederswachtlijst",
      title: "Registreer uw zorglocatie",
      introLead: "Gratis vermelden, betalen bij plaatsing.",
      readPricing: "Lees prijzen & voorwaarden"
    },
    registerSuccess: {
      title: "U staat op de wachtlijst",
      familyBody: "Bedankt voor uw aanmelding. Wij nemen contact op zodra Shepherds Oud u kan begeleiden.",
      facilityBody:
        "Bedankt voor het registreren van uw locatie. Wij nemen contact op wanneer onboarding voor aanbieders start."
    },
    home: {
      metaTitle: brand.name,
      metaDescription:
        "Begeleide zorgnavigatie wanneer thuis wonen niet meer gaat — Care Guide, matching en nazorg in regio Den Haag / Haaglanden.",
      heroSubline:
        "Als thuis wonen niet meer gaat — bij dementie, na ziekenhuis, of wanneer thuiszorg niet meer volstaat.",
      registerInterest: "Meld interesse",
      preferEmail: "Liever mailen? ",
      forFamilies: "Voor families",
      forCareProviders: "Voor zorgaanbieders",
      familiesPrelaunch:
        "Registreer uw interesse. Bij lancering beoordeelt een Care Guide uw situatie persoonlijk.",
      familiesLive: "Start de intake. Een Care Guide belt binnen 24 uur en begeleidt u tot nazorg.",
      providersCard:
        "Gratis vermelden. Betalen alleen bij plaatsing. Ontvang vooraf gematchte familievraagstukken.",
      viewTerms: "Bekijk voorwaarden",
      howItWorksLabel: "Hoe het werkt",
      howItWorksTitle: "Een begeleide reis — geen gids",
      howItWorksDesc:
        "Van eerste gesprek tot plaatsing en nazorg — met één vast aanspreekpunt. Geen eindeloze zoeklijst zoals Filica of ZorgkaartNederland.",
      trustLabel: "Vertrouwen",
      faqLead: "Vragen over Wlz, Wmo, CIZ, PGB of eigen bijdrage? ",
      viewFaq: "Bekijk de FAQ",
      earlyAccessLabel: "Vroege toegang",
      lookingForCare: "Op zoek naar zorg?",
      familiesPrelaunchCard: "Registreer uw interesse; wij nemen contact op wanneer matching start.",
      listLocation: "Locatie vermelden?",
      providersPrelaunchCard: "Gratis registreren. Betalen alleen bij plaatsing.",
      getStartedLabel: "Aan de slag",
      readyToBegin: "Klaar om te beginnen?",
      familiesLiveCard: "Rond de intake af — een Care Guide belt binnen 24 uur.",
      listForFree: "Gratis vermelden",
      providersLiveCard: "Betaal alleen bij succesvolle plaatsing. Lees de voorwaarden.",
      providersSectionLabel: "Aanbieders",
      providersSectionTitle: "Voor zorgaanbieders",
      providersSectionDesc: "Bereik families die écht passen — gratis vermelden, betalen bij plaatsing.",
      registerYourLocation: "Registreer uw locatie"
    }
  }
};

/** Family-facing journey copy (status keys stay English enums). */
export const journeyNl: Record<string, { label: string; hint: string }> = {
  NEW: {
    label: "Aanvraag ontvangen",
    hint: "We hebben uw zorgaanvraag ontvangen en bereiden uw dossier voor."
  },
  CARE_GUIDE_ASSIGNED: {
    label: "Care Guide toegewezen",
    hint: "Een vast aanspreekpunt beoordeelt nu uw dossier en begeleidt elke beslissing."
  },
  ASSESSMENT: {
    label: "Beoordeling",
    hint: "Uw Care Guide brengt zorgbehoefte, urgentie en besliscontext in kaart."
  },
  CARE_PLAN: {
    label: "Zorgplan",
    hint: "Uw Care Guide heeft een aanbevolen route en volgende stappen klaargezet."
  },
  MATCHED: {
    label: "Aanbieders gematcht",
    hint: "Passende aanbieders staan op uw shortlist. Uw Care Guide helpt vergelijken."
  },
  VISIT_SCHEDULED: {
    label: "Bezoek gepland",
    hint: "Een bezoek of terugbelafspraak is geboekt en wordt gevolgd."
  },
  PROVIDER_RESPONSE: {
    label: "Reactie aanbieder",
    hint: "Een aanbieder heeft gereageerd. Uw Care Guide coördineert de volgende stappen."
  },
  PLACEMENT_IN_PROGRESS: {
    label: "Plaatsing loopt",
    hint: "De zorgregeling gaat verder richting opname of verhuizing."
  },
  PLACED: {
    label: "Zorg geregeld",
    hint: "Zorg is veiliggesteld. Uw Care Guide blijft beschikbaar tijdens de overgang."
  },
  FOLLOW_UP_7: {
    label: "Nazorg na 7 dagen",
    hint: "Uw Care Guide checkt in één week na plaatsing."
  },
  FOLLOW_UP_30: {
    label: "Nazorg na 30 dagen",
    hint: "Uw Care Guide checkt in één maand na plaatsing."
  },
  FOLLOW_UP_90: {
    label: "Nazorg na 90 dagen",
    hint: "Uw Care Guide checkt in drie maanden na plaatsing."
  },
  CLOSED: {
    label: "Afgerond",
    hint: "Deze zorgreis is afgesloten."
  }
};
