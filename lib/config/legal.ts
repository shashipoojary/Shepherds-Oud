import type { LegalSection } from "@/components/legal/legal-page";
import { brand, brandHasKvK, brandKvKLabel } from "@/lib/config/brand";
import type { Locale } from "@/lib/i18n/config";

export type LegalPageKey =
  | "privacy"
  | "terms"
  | "cookies"
  | "complaints"
  | "data-deletion"
  | "accessibility"
  | "company";

export type LegalPageContent = {
  label: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  relatedHref: string;
  relatedLabel: string;
};

function legalUpdated(locale: Locale) {
  return locale === "nl" ? "15 juli 2026" : "15 July 2026";
}

function privacyContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Privacybeleid",
      metaTitle: `Privacybeleid | ${brand.name}`,
      metaDescription: `Hoe ${brand.name} persoonsgegevens verzamelt, gebruikt en beschermt onder de AVG.`,
      updated: legalUpdated(locale),
      intro: `${brand.name} ("wij", "ons") biedt menselijke zorgnavigatie voor families wanneer thuis wonen niet meer mogelijk is, en voor zorgaanbieders in heel Nederland. Dit privacybeleid legt uit welke persoonsgegevens we verzamelen, waarom we die gebruiken en welke keuzes u heeft. We verwerken persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en de Nederlandse privacywetgeving.`,
      sections: [
        {
          title: "Wie wij zijn",
          paragraphs: [
            `${brand.name} exploiteert het platform shepherdsoud.nl. Voor privacyvragen of verzoeken kunt u contact opnemen via ${brand.email}.`
          ]
        },
        {
          title: "Welke gegevens we verzamelen",
          paragraphs: ["Afhankelijk van hoe u de dienst gebruikt, kunnen we het volgende verwerken:"],
          list: [
            "Contactgegevens zoals naam, e-mailadres en telefoonnummer",
            "Gezinsintake-informatie over zorgbehoeften, urgentie, locatie, budget en besluitvormers",
            "Wachtlijstregistraties voor families en zorgaanbieders",
            "Profielgegevens van zorgaanbieders",
            "Account- en inloginformatie voor geautoriseerde medewerkers en aanbieders",
            "Technische gegevens zoals IP-adres, browsertype en beveiligingslogs"
          ]
        },
        {
          title: "Hoe we uw gegevens gebruiken",
          paragraphs: ["We gebruiken persoonsgegevens alleen voor legitieme dienstdoeleinden, waaronder:"],
          list: [
            "Beoordelen van zorgaanvragen van families en toewijzen van een Care Guide",
            "Matchen van families met geschikte zorgaanbieders",
            "Coördineren van bezoeken, plaatsing en nazorg",
            "Beheren van wachtlijsten en onboarding van aanbieders",
            "Verzenden van service-e-mails zoals bevestigingen, statusupdates en veilige inloglinks",
            "Beschermen van het platform, voorkomen van misbruik en naleven van wettelijke verplichtingen"
          ]
        },
        {
          title: "Rechtsgrondslagen",
          paragraphs: [
            "We steunen op een of meer van de volgende rechtsgrondslagen: uw toestemming (bijvoorbeeld bij aanmelding op een wachtlijst), uitvoering van een overeenkomst of stappen voorafgaand aan een overeenkomst, gerechtvaardigde belangen bij het veilig aanbieden van zorgnavigatie, en naleving van wettelijke verplichtingen."
          ]
        },
        {
          title: "Delen en verwerkers",
          paragraphs: [
            "We verkopen geen persoonsgegevens. We delen informatie alleen wanneer dat nodig is om de dienst te leveren, bijvoorbeeld met gematchte zorgaanbieders die u wilt benaderen, geautoriseerde Care Guides en beheerders, en vertrouwde verwerkers die infrastructuur hosten, e-mail versturen of authenticatie verzorgen. Deze partijen zijn waar nodig gebonden aan verwerkersovereenkomsten."
          ]
        },
        {
          title: "Bewaartermijnen",
          paragraphs: [
            "We bewaren persoonsgegevens alleen zolang nodig voor de bovenstaande doelen, inclusief zolang een gezinsdossier actief is, zolang een relatie met een aanbieder voortduurt, of zolang de wet dat vereist. Wachtlijstinschrijvingen worden bewaard tot de lancering-outreach is afgerond of u om verwijdering vraagt, tenzij een langere termijn wettelijk verplicht is."
          ]
        },
        {
          title: "Uw rechten",
          paragraphs: ["Onder de AVG kunt u onder meer het recht hebben om:"],
          list: [
            "Inzage te krijgen in de persoonsgegevens die we over u bewaren",
            "Onjuiste of onvolledige gegevens te laten corrigeren",
            "In bepaalde gevallen om verwijdering te verzoeken",
            "Verwerking in bepaalde gevallen te beperken of daartegen bezwaar te maken",
            "Een kopie te ontvangen van door u verstrekte gegevens in een overdraagbaar formaat",
            "Toestemming in te trekken waar verwerking op toestemming is gebaseerd",
            "Een klacht in te dienen bij de Autoriteit Persoonsgegevens"
          ]
        },
        {
          title: "Beveiliging",
          paragraphs: [
            "We gebruiken administratieve, technische en organisatorische maatregelen om persoonsgegevens te beschermen, waaronder toegangscontrole, versleutelde verbindingen en beperkte medewerkers-toegang tot gevoelige dossierinformatie."
          ]
        },
        {
          title: "Wijzigingen",
          paragraphs: [
            "We kunnen dit beleid bijwerken wanneer onze dienst of wettelijke eisen veranderen. De datum bovenaan deze pagina toont wanneer het laatst is herzien."
          ]
        }
      ],
      relatedHref: "/terms",
      relatedLabel: "Gebruiksvoorwaarden"
    };
  }

  return {
    label: "Legal",
    title: "Privacy policy",
    metaTitle: `Privacy policy | ${brand.name}`,
    metaDescription: `How ${brand.name} collects, uses, and protects personal data under GDPR.`,
    updated: legalUpdated(locale),
    intro: `${brand.name} ("we", "us") provides human-guided care navigation for families when living at home is no longer possible, and for care facilities across the Netherlands. This privacy policy explains what personal data we collect, why we use it, and the choices you have. We process personal data in line with the EU General Data Protection Regulation (GDPR) and Dutch privacy law.`,
    sections: [
      {
        title: "Who we are",
        paragraphs: [
          `${brand.name} operates the shepherdsoud.nl platform. For privacy questions or requests, contact us at ${brand.email}.`
        ]
      },
      {
        title: "Data we collect",
        paragraphs: ["Depending on how you use the service, we may process:"],
        list: [
          "Contact details such as name, email address, and phone number",
          "Family intake information about care needs, urgency, location, budget, and decision-makers",
          "Waitlist registrations for families and care facilities",
          "Facility profile details provided by care providers",
          "Account and sign-in information for authorised staff and facility users",
          "Technical data such as IP address, browser type, and security logs"
        ]
      },
      {
        title: "How we use your data",
        paragraphs: ["We use personal data only for legitimate service purposes, including:"],
        list: [
          "Reviewing family care requests and assigning a Care Guide",
          "Matching families with suitable care providers",
          "Coordinating visits, placement, and follow-up support",
          "Operating facility waitlists and provider onboarding",
          "Sending service emails such as confirmations, status updates, and secure sign-in links",
          "Protecting the platform, preventing abuse, and meeting legal obligations"
        ]
      },
      {
        title: "Legal bases",
        paragraphs: [
          "We rely on one or more of the following legal bases: your consent (for example when joining a waitlist), performance of a contract or steps before entering a contract, legitimate interests in operating a safe care-navigation service, and compliance with legal obligations."
        ]
      },
      {
        title: "Sharing and processors",
        paragraphs: [
          "We do not sell personal data. We share information only when needed to deliver the service, such as with matched care facilities you choose to contact, authorised Care Guides and administrators, and trusted processors that host infrastructure, send email, or provide authentication. These providers are bound by data-processing agreements where required."
        ]
      },
      {
        title: "Retention",
        paragraphs: [
          "We keep personal data only as long as needed for the purposes above, including while a family case is active, while a facility relationship continues, or as required by law. Waitlist entries are retained until launch outreach is complete or you ask us to remove them, unless a longer period is legally required."
        ]
      },
      {
        title: "Your rights",
        paragraphs: ["Under GDPR, you may have the right to:"],
        list: [
          "Access the personal data we hold about you",
          "Correct inaccurate or incomplete data",
          "Request erasure in certain circumstances",
          "Restrict or object to processing in certain circumstances",
          "Receive a copy of data you provided in a portable format",
          "Withdraw consent where processing is based on consent",
          "Lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)"
        ]
      },
      {
        title: "Security",
        paragraphs: [
          "We use administrative, technical, and organisational measures to protect personal data, including access controls, encrypted connections, and limited staff access to sensitive case information."
        ]
      },
      {
        title: "Changes",
        paragraphs: [
          "We may update this policy when our service or legal requirements change. The date at the top of this page shows when it was last revised."
        ]
      }
    ],
    relatedHref: "/terms",
    relatedLabel: "Terms of service"
  };
}

function termsContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Gebruiksvoorwaarden",
      metaTitle: `Gebruiksvoorwaarden | ${brand.name}`,
      metaDescription: `Voorwaarden voor het gebruik van de website en zorgnavigatiedienst van ${brand.name}.`,
      updated: legalUpdated(locale),
      intro: `Deze voorwaarden gelden voor het gebruik van de website en zorgnavigatiedienst van ${brand.name}. Door te registreren, een intake in te dienen, u aan te melden op een wachtlijst of het platform anderszins te gebruiken, gaat u akkoord met deze voorwaarden.`,
      sections: [
        {
          title: "Onze dienst",
          paragraphs: [
            `${brand.name} helpt mensen bij zorgkeuzes wanneer thuis wonen niet meer mogelijk is — via menselijke begeleiding, zorgplanning en matching met aanbieders in heel Nederland. Wij zijn een navigatie- en coördinatiedienst — geen medische zorgverlener, spoeddienst of exploitant van een zorginstelling.`,
            "Tijdens de pre-lancering kan de publieke site beperkt zijn tot wachtlijstregistratie. Volledige begeleide intake en aanbiederstools openen wanneer we de lancering in uw regio aankondigen."
          ]
        },
        {
          title: "Geschiktheid en juiste informatie",
          paragraphs: [
            "U moet juiste en volledige informatie verstrekken bij registratie of een zorgaanvraag. Families mogen alleen informatie delen waarvoor zij gemachtigd zijn over de persoon die zorg nodig heeft. Aanbieders moeten zich waarheidsgetrouw registreren en profielinformatie actueel houden zodra onboarding beschikbaar is."
          ]
        },
        {
          title: "Geen spoed- of medisch advies",
          paragraphs: [
            "Gebruik dit platform niet voor medische noodgevallen. Bel 112 of het lokale alarmnummer. Care Guides bieden navigatie en coördinatie; zij vervangen geen medische professionals, juridisch adviseurs of spoeddiensten."
          ]
        },
        {
          title: "Accounts en toegang",
          paragraphs: [
            "Bepaalde functies zijn alleen beschikbaar voor geautoriseerde Care Guides, beheerders en geverifieerde aanbieders. U bent verantwoordelijk voor het veilig houden van inloglinks en accounttoegang. We kunnen toegang opschorten wanneer we redelijkerwijs vermoeden dat de voorwaarden zijn geschonden of het platform wordt misbruikt."
          ]
        },
        {
          title: "Wachtlijst en intake",
          paragraphs: [
            "Aanmelden op een wachtlijst garandeert geen plaatsing, beschikbaarheid van aanbieders of lanceringstijd in een specifieke regio. Een intake indienen creëert geen zorgovereenkomst met een instelling. Plaatsing of zorgafspraken worden rechtstreeks tussen de familie en de gekozen aanbieder gemaakt, onder de voorwaarden van die aanbieder."
          ]
        },
        {
          title: "Deelname van aanbieders",
          paragraphs: [
            "Aanbieders die zich registreren of diensten vermelden, stemmen ermee in professioneel te reageren op gematchte verzoeken, beschikbaarheidsinformatie accuraat te houden, en te voldoen aan toepasselijke zorg- en privacyverplichtingen bij het verwerken van gezinsgegevens via het platform."
          ]
        },
        {
          title: "Aanvaardbaar gebruik",
          paragraphs: ["U stemt ermee in om niet:"],
          list: [
            "Valse, misleidende of schadelijke informatie in te dienen",
            "Te proberen toegang te krijgen tot accounts, beheertools of gegevens waarvoor u niet gemachtigd bent",
            "Het platform of gebruikers te scrapen, te testen of te verstoren",
            "De dienst te gebruiken voor onrechtmatige discriminatie of intimidatie"
          ]
        },
        {
          title: "Intellectueel eigendom",
          paragraphs: [
            `De naam ${brand.name}, branding, website-inhoud en platformsoftware zijn eigendom van ons of onze licentiegevers. U mag deze niet kopiëren of hergebruiken zonder toestemming, behalve voor normaal gebruik van de dienst.`
          ]
        },
        {
          title: "Aansprakelijkheid",
          paragraphs: [
            "Voor zover toegestaan onder Nederlands recht zijn wij niet aansprakelijk voor indirecte schade, winstderving of beslissingen van families of aanbieders buiten onze coördinerende rol. Niets in deze voorwaarden beperkt aansprakelijkheid die niet mag worden uitgesloten onder dwingend recht."
          ]
        },
        {
          title: "Toepasselijk recht",
          paragraphs: [
            "Deze voorwaarden worden beheerst door het recht van Nederland. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland, onverminderd dwingende consumentenbescherming."
          ]
        },
        {
          title: "Contact",
          paragraphs: [`Vragen over deze voorwaarden kunt u sturen naar ${brand.email}.`]
        }
      ],
      relatedHref: "/privacy",
      relatedLabel: "Privacybeleid"
    };
  }

  return {
    label: "Legal",
    title: "Terms of service",
    metaTitle: `Terms of service | ${brand.name}`,
    metaDescription: `Terms governing use of the ${brand.name} website and care-navigation service.`,
    updated: legalUpdated(locale),
    intro: `These terms govern use of the ${brand.name} website and care-navigation service. By registering, submitting an intake, joining a waitlist, or otherwise using the platform, you agree to these terms.`,
    sections: [
      {
        title: "Our service",
        paragraphs: [
          `${brand.name} helps people navigate care decisions when living at home is no longer possible — through human-guided support, care planning, and provider matching across the Netherlands. We are a navigation and coordination service — not a medical provider, emergency service, or care home operator.`,
          "During pre-launch, the public site may be limited to waitlist registration. Full guided intake and provider tools open when we announce launch in your area."
        ]
      },
      {
        title: "Eligibility and accurate information",
        paragraphs: [
          "You must provide accurate, complete information when registering or submitting a care request. Families should only submit information they are authorised to share about the person needing care. Facilities must register truthfully and keep profile information current once onboarding is available."
        ]
      },
      {
        title: "No emergency or medical advice",
        paragraphs: [
          "Do not use this platform for medical emergencies. Call 112 or your local emergency number instead. Care Guides provide navigation support and coordination; they do not replace medical professionals, legal advisers, or urgent crisis services."
        ]
      },
      {
        title: "Accounts and access",
        paragraphs: [
          "Certain features are available only to authorised Care Guides, administrators, and verified facility users. You are responsible for keeping sign-in links and account access secure. We may suspend access where we reasonably believe terms have been breached or the platform is being misused."
        ]
      },
      {
        title: "Waitlist and intake",
        paragraphs: [
          "Joining a waitlist does not guarantee placement, provider availability, or launch timing in a specific region. Submitting an intake does not create a care contract with any facility. Any placement or care arrangement is made directly between the family and the chosen provider, subject to that provider's own terms."
        ]
      },
      {
        title: "Facility participation",
        paragraphs: [
          "Facilities that register or list services agree to respond professionally to matched inquiries, keep availability information accurate, and comply with applicable care-sector and privacy obligations when handling family data shared through the platform."
        ]
      },
      {
        title: "Acceptable use",
        paragraphs: ["You agree not to:"],
        list: [
          "Submit false, misleading, or harmful information",
          "Attempt to access accounts, admin tools, or data you are not authorised to use",
          "Scrape, probe, or disrupt the platform or its users",
          "Use the service for unlawful discrimination or harassment"
        ]
      },
      {
        title: "Intellectual property",
        paragraphs: [
          `The ${brand.name} name, branding, website content, and platform software are owned by us or our licensors. You may not copy or reuse them without permission except as needed for normal use of the service.`
        ]
      },
      {
        title: "Liability",
        paragraphs: [
          "To the fullest extent permitted by Dutch law, we are not liable for indirect loss, loss of profit, or decisions made by families or providers outside our coordination role. Nothing in these terms limits liability that cannot be excluded under mandatory law."
        ]
      },
      {
        title: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of the Netherlands. Disputes shall be submitted to the competent courts in the Netherlands, without prejudice to mandatory consumer protections."
        ]
      },
      {
        title: "Contact",
        paragraphs: [`Questions about these terms can be sent to ${brand.email}.`]
      }
    ],
    relatedHref: "/privacy",
    relatedLabel: "Privacy policy"
  };
}

function cookiesContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Cookiebeleid",
      metaTitle: `Cookiebeleid | ${brand.name}`,
      metaDescription: `Hoe ${brand.name} cookies en vergelijkbare technologieën gebruikt op shepherdsoud.nl.`,
      updated: legalUpdated(locale),
      intro: `Dit cookiebeleid legt uit hoe ${brand.name} cookies en vergelijkbare technologieën gebruikt op shepherdsoud.nl. We houden tracking beperkt en transparant terwijl we een veilige zorgnavigatiedienst in Nederland aanbieden.`,
      sections: [
        {
          title: "Wat cookies zijn",
          paragraphs: [
            "Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u een website bezoekt. Ze helpen de site voorkeuren te onthouden, u ingelogd te houden en misbruik te voorkomen. Vergelijkbare technologieën kunnen lokale opslag van de browser omvatten."
          ]
        },
        {
          title: "Cookies die we gebruiken",
          paragraphs: ["Afhankelijk van hoe u het platform gebruikt, kunnen we gebruiken:"],
          list: [
            "Strikt noodzakelijke cookies voor beveiliging, sessiebeheer en inloggen",
            "Functionele cookies die basisvoorkeuren onthouden voor het gebruik van de dienst",
            "Beperkte analytische cookies, indien ingeschakeld, om te begrijpen hoe de publieke site wordt gebruikt zodat we duidelijkheid en toegankelijkheid kunnen verbeteren"
          ]
        },
        {
          title: "Rechtsgrondslag",
          paragraphs: [
            "Strikt noodzakelijke cookies worden gebruikt omdat ze nodig zijn om de gevraagde dienst te leveren en het platform veilig te houden. Waar niet-essentiële cookies worden gebruikt, steunen we op uw toestemming waar dat vereist is onder de ePrivacy-regels en de AVG."
          ]
        },
        {
          title: "Cookies beheren",
          paragraphs: [
            "U kunt cookies beheren via uw browserinstellingen, inclusief het blokkeren of verwijderen van cookies. Als u strikt noodzakelijke cookies blokkeert, werken onderdelen van de dienst zoals veilig inloggen mogelijk niet goed.",
            `Voor vragen over cookies of gerelateerde gegevensverwerking kunt u contact opnemen via ${brand.email}. Meer details over persoonsgegevens staan in ons privacybeleid.`
          ]
        },
        {
          title: "Updates",
          paragraphs: [
            "We kunnen dit cookiebeleid bijwerken wanneer onze technologie of wettelijke eisen veranderen. De datum bovenaan deze pagina toont wanneer het laatst is herzien."
          ]
        }
      ],
      relatedHref: "/privacy",
      relatedLabel: "Privacybeleid"
    };
  }

  return {
    label: "Legal",
    title: "Cookies policy",
    metaTitle: `Cookies policy | ${brand.name}`,
    metaDescription: `How ${brand.name} uses cookies and similar technologies on shepherdsoud.nl.`,
    updated: legalUpdated(locale),
    intro: `This cookies policy explains how ${brand.name} uses cookies and similar technologies on shepherdsoud.nl. We aim to keep tracking limited and transparent while operating a secure care-navigation service in the Netherlands.`,
    sections: [
      {
        title: "What cookies are",
        paragraphs: [
          "Cookies are small text files stored on your device when you visit a website. They help the site remember preferences, keep you signed in, and protect against abuse. Similar technologies may include local storage used by the browser."
        ]
      },
      {
        title: "Cookies we use",
        paragraphs: ["Depending on how you use the platform, we may use:"],
        list: [
          "Strictly necessary cookies for security, session management, and sign-in",
          "Functional cookies that remember basic preferences related to using the service",
          "Limited analytics cookies, if enabled, to understand how the public site is used so we can improve clarity and accessibility"
        ]
      },
      {
        title: "Legal basis",
        paragraphs: [
          "Strictly necessary cookies are used because they are required to provide the service you request and to keep the platform secure. Where non-essential cookies are used, we rely on your consent where required under the ePrivacy rules and GDPR."
        ]
      },
      {
        title: "Managing cookies",
        paragraphs: [
          "You can control cookies through your browser settings, including blocking or deleting cookies. If you block strictly necessary cookies, parts of the service such as secure sign-in may not work correctly.",
          `For questions about cookies or related data processing, contact ${brand.email}. More detail on personal data is in our privacy policy.`
        ]
      },
      {
        title: "Updates",
        paragraphs: [
          "We may update this cookies policy when our technology or legal requirements change. The date at the top of this page shows when it was last revised."
        ]
      }
    ],
    relatedHref: "/privacy",
    relatedLabel: "Privacy policy"
  };
}

function complaintsContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Klachten",
      metaTitle: `Klachten | ${brand.name}`,
      metaDescription: `Hoe u een klacht indient over de zorgnavigatiedienst van ${brand.name}.`,
      updated: legalUpdated(locale),
      intro: `${brand.name} wil dat families, zorgzoekenden en aanbieders veilig zorgen kunnen uiten. Deze pagina legt uit hoe u een klacht indient over onze zorgnavigatiedienst en hoe we daarmee omgaan.`,
      sections: [
        {
          title: "Waarover u kunt klagen",
          paragraphs: [
            "U kunt klagen over onze communicatie, de behandeling van een intake of match, hoe persoonsgegevens zijn gebruikt, de toegankelijkheid van de website, of het gedrag van iemand die namens Shepherds Oud Care handelt in een navigatie- of coördinatierol.",
            "Klachten over klinische zorg, een toelatingsbesluit of een contract van een zorginstelling moet u meestal eerst bij die aanbieder indienen. Wij kunnen u helpen de volgende stappen te begrijpen waar passend, maar wij beslissen niet over toelatingen."
          ]
        },
        {
          title: "Hoe u een klacht indient",
          paragraphs: [
            `Stuur een e-mail naar ${brand.email} met als onderwerp "Klacht", uw naam, de beste manier om u te bereiken, en een duidelijke beschrijving van wat er is gebeurd en welk resultaat u zoekt. Vermeld een dossierreferentie als u die heeft.`,
            "Als uw klacht persoonsgegevens onder de AVG betreft, vermeld dat duidelijk zodat we het waar nodig als privacyverzoek kunnen behandelen."
          ]
        },
        {
          title: "Hoe we klachten behandelen",
          paragraphs: [
            "We streven ernaar klachten binnen één werkdag te bevestigen en zo snel als redelijkerwijs mogelijk een inhoudelijk antwoord te geven, meestal binnen 14 dagen. Complexe zaken kunnen langer duren; we laten het weten als meer tijd nodig is.",
            "We bekijken de feiten, spreken waar nodig met relevante Care Guides of medewerkers, en leggen onze bevindingen en eventuele vervolgstappen uit."
          ]
        },
        {
          title: "Externe opties",
          paragraphs: [
            "Als u niet tevreden bent met ons antwoord over persoonsgegevens, kunt u een klacht indienen bij de Autoriteit Persoonsgegevens. Afhankelijk van het onderwerp kunnen ook andere sector- of consumenteninstanties beschikbaar zijn."
          ]
        }
      ],
      relatedHref: "/privacy",
      relatedLabel: "Privacybeleid"
    };
  }

  return {
    label: "Legal",
    title: "Complaints",
    metaTitle: `Complaints | ${brand.name}`,
    metaDescription: `How to submit a complaint about the ${brand.name} care-navigation service.`,
    updated: legalUpdated(locale),
    intro: `${brand.name} wants families, care seekers, and providers to be able to raise concerns safely. This page explains how to submit a complaint about our care-navigation service and how we handle it.`,
    sections: [
      {
        title: "What you can complain about",
        paragraphs: [
          "You may complain about our communication, the handling of an intake or match, how personal data was used, accessibility of the website, or the conduct of someone acting for Shepherds Oud Care in a navigation or coordination role.",
          "Complaints about a care facility's clinical care, admission decision, or contract should usually be raised with that provider first. We can help you understand next steps where appropriate, but we do not decide facility admissions."
        ]
      },
      {
        title: "How to submit a complaint",
        paragraphs: [
          `Email ${brand.email} with the subject line "Complaint", your name, the best way to reach you, and a clear description of what happened and what outcome you are seeking. Include any case reference if you have one.`,
          "If your complaint concerns personal data under GDPR, say so clearly so we can treat it as a data-protection request where needed."
        ]
      },
      {
        title: "How we handle complaints",
        paragraphs: [
          "We aim to acknowledge complaints within one business day and to provide a substantive response as soon as reasonably possible, usually within 14 days. Complex matters may take longer; we will tell you if more time is needed.",
          "We review the facts, speak with relevant Care Guides or staff where appropriate, and explain our findings and any steps we will take."
        ]
      },
      {
        title: "External options",
        paragraphs: [
          "If you are not satisfied with our response about personal data, you may lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). Other sector or consumer bodies may also be available depending on the issue."
        ]
      }
    ],
    relatedHref: "/privacy",
    relatedLabel: "Privacy policy"
  };
}

function dataDeletionContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Gegevens wissen",
      metaTitle: `Gegevens wissen | ${brand.name}`,
      metaDescription: `Hoe u bij ${brand.name} een verzoek tot verwijdering van persoonsgegevens indient.`,
      updated: legalUpdated(locale),
      intro: `Onder de AVG kunt u ${brand.name} in bepaalde omstandigheden vragen persoonsgegevens te wissen. Deze pagina legt uit hoe u om verwijdering verzoekt en wat we meestal nodig hebben om uw verzoek te verwerken.`,
      sections: [
        {
          title: "Uw recht op wissen",
          paragraphs: [
            "U kunt om wissen verzoeken wanneer persoonsgegevens niet meer nodig zijn voor de doelen waarvoor ze zijn verzameld, wanneer u toestemming intrekt en er geen andere rechtsgrond is, wanneer u bezwaar maakt en wij geen zwaarder wegende gerechtvaardigde gronden hebben, of in andere situaties zoals genoemd in artikel 17 AVG.",
            "Wissen is niet absoluut. We mogen gegevens bewaren wanneer dat nodig is om aan een wettelijke verplichting te voldoen, rechtsvorderingen in te stellen of te verdedigen, of op andere beperkte gronden die de AVG erkent."
          ]
        },
        {
          title: "Hoe u om verwijdering verzoekt",
          paragraphs: [
            `Stuur een e-mail naar ${brand.email} met als onderwerp "Verzoek gegevenswissen". Vermeld het e-mailadres dat op het platform is gebruikt, uw volledige naam, en of het verzoek een gezinsintake, wachtlijstinschrijving, aanbiedersaccount of een ander record betreft.`,
            "Om privacy te beschermen kunnen we u vragen uw identiteit te bevestigen voordat we gegevens wissen of de toegang beperken."
          ]
        },
        {
          title: "Wat er daarna gebeurt",
          paragraphs: [
            "We streven ernaar verzoeken tot wissen binnen één werkdag te bevestigen en het verzoek binnen één maand af te ronden of te beantwoorden, zoals de AVG vereist. Als het verzoek complex is of we meer informatie nodig hebben, laten we dat weten.",
            "Waar we gegevens niet volledig kunnen wissen, leggen we uit waarom en welke alternatieven mogelijk gelden, zoals beperking van de verwerking."
          ]
        },
        {
          title: "Gerelateerde rechten",
          paragraphs: [
            "U kunt ook inzage, correctie, beperking of een overdraagbare kopie van door u verstrekte gegevens vragen. Details staan in ons privacybeleid. U kunt toestemming voor wachtlijst of marketing op elk moment intrekken door contact met ons op te nemen."
          ]
        }
      ],
      relatedHref: "/privacy",
      relatedLabel: "Privacybeleid"
    };
  }

  return {
    label: "Legal",
    title: "Data deletion",
    metaTitle: `Data deletion | ${brand.name}`,
    metaDescription: `How to request deletion of personal data from ${brand.name} under GDPR.`,
    updated: legalUpdated(locale),
    intro: `Under the GDPR you may ask ${brand.name} to erase personal data in certain circumstances. This page explains how to request deletion and what we typically need to process your request.`,
    sections: [
      {
        title: "Your right to erasure",
        paragraphs: [
          "You may request erasure when personal data is no longer needed for the purposes it was collected, when you withdraw consent and there is no other legal basis, when you object and we have no overriding legitimate grounds, or in other situations set out in Article 17 GDPR.",
          "Erasure is not absolute. We may retain data where necessary to comply with a legal obligation, establish or defend legal claims, or for other limited grounds recognised under GDPR."
        ]
      },
      {
        title: "How to request deletion",
        paragraphs: [
          `Send an email to ${brand.email} with the subject line "Data deletion request". Include the email address used on the platform, your full name, and whether the request concerns a family intake, waitlist entry, provider account, or another record.`,
          "To protect privacy, we may ask you to confirm your identity before deleting or restricting access to data."
        ]
      },
      {
        title: "What happens next",
        paragraphs: [
          "We aim to acknowledge deletion requests within one business day and to complete or respond to the request within one month, as required by GDPR. If the request is complex or we need more information, we will tell you.",
          "Where we cannot fully erase data, we will explain why and what alternatives may apply, such as restriction of processing."
        ]
      },
      {
        title: "Related rights",
        paragraphs: [
          "You may also request access, correction, restriction, or a portable copy of data you provided. Details are in our privacy policy. You can withdraw waitlist or marketing consent at any time by contacting us."
        ]
      }
    ],
    relatedHref: "/privacy",
    relatedLabel: "Privacy policy"
  };
}

function accessibilityContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Toegankelijkheid",
      metaTitle: `Toegankelijkheid | ${brand.name}`,
      metaDescription: `Hoe ${brand.name} werkt aan een toegankelijke zorgnavigatie-ervaring.`,
      updated: legalUpdated(locale),
      intro: `${brand.name} zet zich in om zorgnavigatie-informatie bruikbaar te maken voor ouderen, mensen met dementie of verminderde mobiliteit, mantelzorgers en mensen die hulpmiddelen gebruiken. We werken in de geest van de Web Content Accessibility Guidelines (WCAG) 2.2 niveau AA.`,
      sections: [
        {
          title: "Onze aanpak",
          paragraphs: [
            "We ontwerpen publieke pagina's en belangrijke formulieren met duidelijke taal, voldoende kleurcontrast, met het toetsenbord bereikbare bediening en leesbare typografie. We blijven toegankelijkheid verbeteren terwijl het platform groeit van vroege registratie naar volledige begeleide matching."
          ]
        },
        {
          title: "Bekende beperkingen",
          paragraphs: [
            "Sommige interactieve dashboards en inlog- of e-mailflows van derden voldoen mogelijk nog niet aan elk toegankelijkheidscriterium. We geven prioriteit aan fixes die gezinsintake, wachtlijstregistratie en het lezen van zorginformatie raken."
          ]
        },
        {
          title: "Feedback en hulp",
          paragraphs: [
            `Als u een drempel tegenkomt — bijvoorbeeld inhoud die moeilijk leesbaar is, een formulier dat niet met toetsenbord of schermlezer kan worden ingevuld, of informatie die u in een ander formaat nodig heeft — neem contact op via ${brand.email}. Beschrijf de pagina en het probleem zodat we kunnen helpen.`,
            "We streven ernaar toegankelijkheidsfeedback binnen één werkdag te bevestigen en een redelijk alternatief te bieden wanneer een snelle fix nog niet beschikbaar is."
          ]
        },
        {
          title: "Voortdurende verbetering",
          paragraphs: [
            "Toegankelijkheid is een doorlopend traject. We bekijken feedback, werken componenten bij en testen kritieke journeys terwijl we persoonlijke matching landelijk uitrollen."
          ]
        }
      ],
      relatedHref: "/company",
      relatedLabel: "Bedrijfsgegevens"
    };
  }

  return {
    label: "Legal",
    title: "Accessibility",
    metaTitle: `Accessibility | ${brand.name}`,
    metaDescription: `How ${brand.name} works toward an accessible care-navigation experience.`,
    updated: legalUpdated(locale),
    intro: `${brand.name} is committed to making care navigation information usable for older adults, people living with dementia or reduced mobility, caregivers, and people who use assistive technologies. We work toward the spirit of the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.`,
    sections: [
      {
        title: "Our approach",
        paragraphs: [
          "We design public pages and key forms with clear language, sufficient colour contrast, keyboard-reachable controls, and readable typography. We continue to improve accessibility as the platform expands from early registration to full guided matching."
        ]
      },
      {
        title: "Known limitations",
        paragraphs: [
          "Some interactive dashboards and third-party sign-in or email flows may not yet meet every accessibility criterion. We prioritise fixes that affect family intake, waitlist registration, and core reading of care guidance."
        ]
      },
      {
        title: "Feedback and assistance",
        paragraphs: [
          `If you encounter a barrier — for example content that is hard to read, a form that cannot be completed with a keyboard or screen reader, or information you need in an alternative format — contact ${brand.email}. Please describe the page and the problem so we can help.`,
          "We aim to acknowledge accessibility feedback within one business day and to provide a reasonable alternative where a quick fix is not yet available."
        ]
      },
      {
        title: "Continuous improvement",
        paragraphs: [
          "Accessibility is an ongoing effort. We review feedback, update components, and test critical journeys as we roll out personal matching nationwide across the Netherlands."
        ]
      }
    ],
    relatedHref: "/company",
    relatedLabel: "Company details"
  };
}

function companyContent(locale: Locale): LegalPageContent {
  if (locale === "nl") {
    return {
      label: "Juridisch",
      title: "Bedrijfsgegevens",
      metaTitle: `Bedrijfsgegevens | ${brand.name}`,
      metaDescription: `Bedrijfsgegevens voor ${brand.name}, zorgnavigatie in Nederland.`,
      updated: legalUpdated(locale),
      intro: brandHasKvK()
        ? `Deze pagina bevat bedrijfsgegevens van ${brand.name}, de zorgnavigatiedienst die in Nederland wordt aangeboden.`
        : `Deze pagina bevat bedrijfsgegevens van ${brand.name}, de zorgnavigatiedienst die in Nederland wordt aangeboden. Inschrijving bij de Kamer van Koophandel (KvK) is in behandeling; het nummer verschijnt hier zodra het is uitgegeven.`,
      sections: [
        {
          title: "Rechtspersoon",
          paragraphs: [
            `Handelsnaam: ${brand.name}`,
            `Rechtspersoon: ${brand.legalEntityName}`,
            `Kamer van Koophandel (KvK)-nummer: ${brandKvKLabel("nl")}`,
            `Vestigingsadres: ${brand.registeredAddress === "Netherlands" ? "Nederland" : brand.registeredAddress}`
          ]
        },
        {
          title: "Contact",
          paragraphs: [
            `E-mail: ${brand.email}`,
            brand.phone ? `Telefoon: ${brand.phone}` : "Telefoon: nog niet gepubliceerd — gebruik e-mail voor contact.",
            "We streven ernaar algemene vragen binnen één werkdag te beantwoorden."
          ]
        },
        {
          title: "Onze rol",
          paragraphs: [
            `${brand.name} biedt zorgnavigatie, matchingondersteuning en coördinatie. Wij geven geen medisch advies, garanderen geen toelating tot een instelling, vervangen niet uw arts, gemeente, zorgkantoor of spoeddiensten, en nemen geen definitieve beslissingen over geschiktheid voor publiek gefinancierde zorg.`
          ]
        },
        {
          title: "Klachten en privacy",
          paragraphs: [
            "Voor klachten, verzoeken tot gegevenswissen of privacyvragen gebruikt u de speciale pagina's in de websitefooter, of mailt u ons rechtstreeks."
          ]
        }
      ],
      relatedHref: "/privacy",
      relatedLabel: "Privacybeleid"
    };
  }

  return {
    label: "Legal",
    title: "Company details",
    metaTitle: `Company details | ${brand.name}`,
    metaDescription: `Company details for ${brand.name}, care navigation in the Netherlands.`,
    updated: legalUpdated(locale),
    intro: brandHasKvK()
      ? `This page provides company details for ${brand.name}, the care-navigation service operated in the Netherlands.`
      : `This page provides company details for ${brand.name}, the care-navigation service operated in the Netherlands. Chamber of Commerce (KvK) registration is in progress; the number will appear here once issued.`,
    sections: [
      {
        title: "Legal entity",
        paragraphs: [
          `Trading name: ${brand.name}`,
          `Legal entity: ${brand.legalEntityName}`,
          `Chamber of Commerce (KvK) number: ${brandKvKLabel("en")}`,
          `Registered address: ${brand.registeredAddress}`
        ]
      },
      {
        title: "Contact",
        paragraphs: [
          `Email: ${brand.email}`,
          brand.phone ? `Phone: ${brand.phone}` : "Phone: not published yet — please use email for contact.",
          "We aim to respond to general enquiries within one business day."
        ]
      },
      {
        title: "Our role",
        paragraphs: [
          `${brand.name} provides care navigation, matching support, and coordination. We do not provide medical advice, guarantee admission to any facility, replace your doctor, municipality, care office (zorgkantoor), or emergency services, or make final eligibility decisions for publicly funded care.`
        ]
      },
      {
        title: "Complaints and privacy",
        paragraphs: [
          "For complaints, data-deletion requests, or privacy questions, use the dedicated pages linked in the website footer, or email us directly."
        ]
      }
    ],
    relatedHref: "/privacy",
    relatedLabel: "Privacy policy"
  };
}

/** Locale-aware legal page copy (privacy, terms, cookies, …). */
export function legalPages(locale: Locale = "nl"): Record<LegalPageKey, LegalPageContent> {
  return {
    privacy: privacyContent(locale),
    terms: termsContent(locale),
    cookies: cookiesContent(locale),
    complaints: complaintsContent(locale),
    "data-deletion": dataDeletionContent(locale),
    accessibility: accessibilityContent(locale),
    company: companyContent(locale)
  };
}

/** Default (NL) labels — EN overrides via productUi().footer.legalLabel */
export const legalFooterLinks = [
  { label: "Privacybeleid", href: "/privacy" },
  { label: "Voorwaarden", href: "/terms" },
  { label: "Cookiebeleid", href: "/cookies" },
  { label: "Klachten", href: "/complaints" },
  { label: "Gegevens wissen", href: "/data-deletion" },
  { label: "Toegankelijkheid", href: "/accessibility" },
  { label: "Bedrijfsgegevens", href: "/company" }
] as const;
