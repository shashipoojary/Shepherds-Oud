import type { Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/get-locale";
import { dateLocale } from "@/lib/i18n/ui";

/** Prefer explicit locale; otherwise read the so_locale cookie from the current request. */
export async function resolveEmailLocale(explicit?: Locale): Promise<Locale> {
  if (explicit) return explicit;
  return getLocale();
}

export function emailGreeting(locale: Locale, name: string) {
  return locale === "en" ? `Dear ${name},` : `Beste ${name},`;
}

export function formatEmailDate(locale: Locale, date: Date) {
  return date.toLocaleDateString(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatEmailDateTime(locale: Locale, date: Date) {
  return date.toLocaleString(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function emailCopy(locale: Locale) {
  const en = locale === "en";
  return {
    intakeConfirmation: {
      subject: en
        ? "We've received your Shepherds Oud care request"
        : "We hebben uw Shepherds Oud zorgaanvraag ontvangen",
      preheader: en
        ? "We've received your Shepherds Oud care request."
        : "We hebben uw Shepherds Oud zorgaanvraag ontvangen.",
      eyebrow: en ? "Care request received" : "Zorgaanvraag ontvangen",
      title: en ? "Thank you — we're with you" : "Bedankt — wij staan naast u",
      received: (reference: string) =>
        en
          ? `We've received your care request. Your reference is ${reference}.`
          : `We hebben uw zorgaanvraag ontvangen. Uw referentie is ${reference}.`,
      guideAssigned: (guideName: string, email: string) =>
        en
          ? `${guideName} (${email}) is your dedicated Care Guide and will review your case personally.`
          : `${guideName} (${email}) is uw vaste Care Guide en beoordeelt uw dossier persoonlijk.`,
      guidePending: en
        ? "A Care Guide will be assigned shortly to support you through each decision."
        : "Er wordt spoedig een Care Guide aan u toegewezen die u bij elke beslissing begeleidt.",
      guideFallback: en ? "Your Care Guide" : "Uw Care Guide",
      cta: en ? "Open your dashboard" : "Open uw dashboard",
      footerNote: (reference: string) =>
        en
          ? `Reference ${reference}. Keep this email for your records.`
          : `Referentie ${reference}. Bewaar deze e-mail voor uw administratie.`
    },
    waitlist: {
      subject: en
        ? "Thanks for registering with Shepherds Oud"
        : "Bedankt voor uw aanmelding bij Shepherds Oud",
      preheader: en
        ? "Thanks for registering with Shepherds Oud."
        : "Bedankt voor uw aanmelding bij Shepherds Oud.",
      eyebrow: en ? "Waitlist" : "Wachtlijst",
      title: en ? "You're on the list" : "U staat op de lijst",
      thanks: en
        ? "Thanks for registering with Shepherds Oud."
        : "Bedankt voor uw aanmelding bij Shepherds Oud.",
      facility: en
        ? "We'll contact you when provider onboarding starts in your region."
        : "Wij nemen contact op wanneer onboarding voor aanbieders in uw regio start.",
      family: en
        ? "We'll contact you when guided matching starts in your region."
        : "Wij nemen contact op zodra begeleide matching in uw regio start.",
      cta: en ? "Visit Shepherds Oud" : "Bezoek Shepherds Oud",
      footerNote: en
        ? "You don't need to do anything until we email you."
        : "U hoeft niets te doen totdat wij u mailen."
    },
    familyMagicLink: {
      subject: en ? "Open your Shepherds Oud care dashboard" : "Open uw Shepherds Oud zorgdashboard",
      preheader: en
        ? "Your secure sign-in link for the Shepherds Oud care dashboard."
        : "Uw beveiligde inloglink voor het Shepherds Oud zorgdashboard.",
      eyebrow: en ? "Care dashboard sign-in" : "Inloggen zorgdashboard",
      title: en ? "Open your care dashboard" : "Open uw zorgdashboard",
      paragraphs: en
        ? [
            "Click the button below to sign in securely and continue your care journey.",
            "For your security, this link can be used once and expires in 15 minutes."
          ]
        : [
            "Klik op de knop hieronder om veilig in te loggen en verder te gaan met uw zorgreis.",
            "Voor uw veiligheid is deze link eenmalig en verloopt deze over 15 minuten."
          ],
      cta: en ? "Open care dashboard" : "Open zorgdashboard",
      footerNote: en
        ? "Didn't request this email? You can safely ignore it. Nothing changes on your request."
        : "Heeft u deze e-mail niet aangevraagd? Dan kunt u deze veilig negeren. Er verandert niets aan uw aanvraag.",
      textLead: en ? "Sign in to your care dashboard" : "Log in op uw zorgdashboard",
      textBody: en
        ? "Use this secure link to view your care request and matches:"
        : "Gebruik deze beveiligde link om uw zorgaanvraag en matches te bekijken:",
      textExpiry: en
        ? "This link expires in 15 minutes. Didn't request it? You can ignore this email."
        : "Deze link verloopt over 15 minuten. Heeft u deze niet aangevraagd? Dan kunt u deze e-mail negeren."
    },
    providerMagicLink: {
      subject: en ? "Sign in to Shepherds Oud" : "Inloggen bij Shepherds Oud",
      preheader: en
        ? "Your secure sign-in link for the Shepherds Oud provider dashboard."
        : "Uw beveiligde inloglink voor het Shepherds Oud aanbiedersdashboard.",
      eyebrow: en ? "Provider sign-in" : "Inloggen aanbieder",
      title: en ? "Open your provider dashboard" : "Open uw aanbiedersdashboard",
      paragraphs: en
        ? [
            "Click the button below to sign in securely. This link works with any email address, including Apple, Microsoft, Gmail, and your organisation domain.",
            "For your security, this link can be used once and expires in 15 minutes."
          ]
        : [
            "Klik op de knop hieronder om veilig in te loggen. Deze link werkt met elk e-mailadres, inclusief Apple, Microsoft, Gmail en uw organisatiedomein.",
            "Voor uw veiligheid is deze link eenmalig en verloopt deze over 15 minuten."
          ],
      cta: en ? "Open provider dashboard" : "Open aanbiedersdashboard",
      footerNote: en
        ? "Didn't request this email? You can safely ignore it. Nothing changes on your account."
        : "Heeft u deze e-mail niet aangevraagd? Dan kunt u deze veilig negeren. Er verandert niets aan uw account.",
      textLead: en ? "Sign in to your provider dashboard" : "Log in op uw aanbiedersdashboard",
      textBody: en
        ? "Use this secure link to open your dashboard:"
        : "Gebruik deze beveiligde link om uw dashboard te openen:",
      textExpiry: en
        ? "This link expires in 15 minutes. Didn't request it? You can ignore this email."
        : "Deze link verloopt over 15 minuten. Heeft u deze niet aangevraagd? Dan kunt u deze e-mail negeren."
    },
    intakeStatus: {
      eyebrow: en ? "Your guided care journey" : "Uw begeleide zorgreis",
      cta: en ? "Open your dashboard" : "Open uw dashboard",
      guideFallback: en ? "Your Care Guide" : "Uw Care Guide",
      agreedMoment: en ? "the agreed time" : "het afgesproken moment",
      matched: {
        title: en ? "Your provider shortlist is ready" : "Uw shortlist met aanbieders is klaar",
        body: en
          ? "Matched providers are now on your shortlist — the key update in your guided care journey."
          : "Gematchte aanbieders staan nu op uw shortlist — de belangrijkste update in uw begeleide zorgreis.",
        guide: (guideName: string) =>
          en
            ? `${guideName} is available if you have questions while comparing.`
            : `${guideName} denkt mee als u vragen heeft tijdens het vergelijken.`,
        ctaHint: en
          ? "Open your dashboard to review matches and request visits."
          : "Open uw dashboard om matches te bekijken en bezoeken aan te vragen."
      },
      visit: {
        title: en
          ? "Your visit or callback is scheduled"
          : "Uw bezoek of terugbelafspraak is gepland",
        planned: (guideName: string, provider?: string | null) =>
          en
            ? `${guideName} has scheduled the next step${provider ? ` with ${provider}` : ""}.`
            : `${guideName} heeft de volgende stap gepland${provider ? ` met ${provider}` : ""}.`,
        when: (when: string) => (en ? `Schedule: ${when}.` : `Planning: ${when}.`),
        hint: en
          ? "Open your dashboard for details and any notes from your Care Guide."
          : "Open uw dashboard voor details en eventuele notities van uw Care Guide."
      },
      placed: {
        title: en ? "Care has been arranged" : "Zorg is geregeld",
        body: en ? "We're glad to share that care has been arranged." : "We delen graag dat de zorg is geregeld.",
        guide: (guideName: string) =>
          en
            ? `${guideName} remains available if you need support during the transition.`
            : `${guideName} blijft beschikbaar als u steun nodig heeft tijdens de overgang.`,
        hint: en
          ? "You'll find the latest details on your dashboard."
          : "Op uw dashboard vindt u de laatste details."
      },
      footer: (reference: string, statusLabel: string) =>
        en
          ? `Reference ${reference} · Status: ${statusLabel}`
          : `Referentie ${reference} · Status: ${statusLabel}`
    },
    familyMatch: {
      eyebrow: en ? "New provider match" : "Nieuwe aanbiedermatch",
      cta: en ? "View your matches" : "Bekijk uw matches",
      footer: (dashboardUrl: string) =>
        en
          ? `You can also open your dashboard anytime: ${dashboardUrl}`
          : `U kunt ook altijd uw dashboard openen: ${dashboardUrl}`,
      reopenedTitle: (provider: string) =>
        en ? `${provider} is back on your shortlist` : `${provider} staat weer op uw shortlist`,
      newTitle: (provider: string) =>
        en ? `You've been matched with ${provider}` : `U bent gematcht met ${provider}`,
      reopenedBody: (provider: string) =>
        en
          ? [
              `Your Care Guide put ${provider} back on your shortlist so you can reconsider this option.`,
              "Review the match and request a visit or callback when you're ready.",
              "Your Care Guide remains available if you want help deciding."
            ]
          : [
              `Uw Care Guide heeft ${provider} opnieuw op uw shortlist gezet zodat u deze opnieuw kunt overwegen.`,
              "Bekijk de match en vraag een bezoek of terugbelafspraak aan wanneer u er klaar voor bent.",
              "Uw Care Guide blijft beschikbaar als u hulp wilt bij de keuze."
            ],
      newBody: (provider: string) =>
        en
          ? [
              `You've been matched with ${provider}.`,
              "This facility is now on your shortlist. Review the details and request a visit or callback when you're ready.",
              "Your Care Guide can help if you have questions while comparing."
            ]
          : [
              `U bent gematcht met ${provider}.`,
              "Deze locatie staat nu op uw shortlist. Bekijk de details en vraag een bezoek of terugbelafspraak aan wanneer u er klaar voor bent.",
              "Uw Care Guide denkt mee als u vragen heeft tijdens het vergelijken."
            ]
    },
    providerMatch: {
      eyebrow: en ? "Possible referral" : "Mogelijke doorverwijzing",
      cta: en ? "Open provider dashboard" : "Open aanbiedersdashboard",
      footer: en
        ? "No action is needed until the family requests a visit or callback."
        : "Er is geen actie nodig totdat de familie een bezoek of terugbelafspraak aanvraagt.",
      reopenedTitle: en ? "A previous referral has been reopened" : "Een eerdere doorverwijzing is heropend",
      newTitle: en ? "You have a new possible referral" : "U heeft een nieuwe mogelijke doorverwijzing",
      reopenedBody: en
        ? "A Care Guide reopened a family referral to your facility."
        : "Een Care Guide heeft een familiedoorverwijzing naar uw locatie heropend.",
      newBody: en
        ? "You have a new possible referral via Shepherds Oud."
        : "U heeft een nieuwe mogelijke doorverwijzing via Shepherds Oud.",
      details: (area: string, care: string, urgency: string) =>
        en
          ? `Area: ${area}. Care need: ${care}. Urgency: ${urgency}.`
          : `Regio: ${area}. Zorgbehoefte: ${care}. Urgentie: ${urgency}.`,
      hint: en
        ? "The family can view your profile and request a visit or callback. Open your dashboard for context when that happens."
        : "De familie kan uw profiel bekijken en een bezoek of terugbelafspraak aanvragen. Open uw dashboard voor context wanneer dat gebeurt."
    },
    providerInquiry: {
      eyebrow: en ? "New family inquiry" : "Nieuwe familieaanvraag",
      cta: en ? "Open provider dashboard" : "Open aanbiedersdashboard",
      footer: en
        ? "Please respond promptly so families know you received their request."
        : "Reageer snel zodat families weten dat u hun verzoek heeft ontvangen.",
      visitTitle: en ? "A family requested a visit" : "Een familie heeft een bezoek aangevraagd",
      callbackTitle: en
        ? "A family requested a callback"
        : "Een familie heeft een terugbelafspraak gevraagd",
      body: (family: string, area: string, isVisit: boolean) =>
        en
          ? `${family} from ${area} requested ${isVisit ? "a visit" : "a callback"} via Shepherds Oud.`
          : `${family} uit ${area} heeft via Shepherds Oud ${isVisit ? "een bezoek" : "een terugbelafspraak"} aangevraagd.`,
      details: (care: string, urgency: string) =>
        en
          ? `Care need: ${care}. Urgency: ${urgency}.`
          : `Zorgbehoefte: ${care}. Urgentie: ${urgency}.`,
      hint: en
        ? "Open your provider dashboard to accept or decline this request."
        : "Open uw aanbiedersdashboard om deze aanvraag te accepteren of af te wijzen."
    },
    providerStatus: {
      eyebrow: en ? "Status update" : "Statusupdate",
      cta: en ? "Open provider dashboard" : "Open aanbiedersdashboard",
      footerTagline: (tagline: string) => `Shepherds Oud — ${tagline}`,
      visitTitle: en
        ? "Visit or callback confirmed"
        : "Bezoek of terugbelafspraak bevestigd",
      chosenTitle: en ? "A family chose your facility" : "Een familie koos uw locatie",
      visitPlanned: (family: string) =>
        en
          ? `A Care Guide scheduled the next step for ${family}.`
          : `Een Care Guide heeft de volgende stap gepland voor ${family}.`,
      visitDefaultType: en ? "Visit or callback" : "Bezoek of terugbelafspraak",
      visitWhen: (when: string) => (en ? `Schedule: ${when}.` : `Planning: ${when}.`),
      visitOpenDashboard: en
        ? "Open your dashboard for the latest schedule and notes."
        : "Open uw dashboard voor de laatste planning en notities.",
      notes: (notes: string) => (en ? `Notes: ${notes}` : `Notities: ${notes}`),
      visitHint: en
        ? "Check your provider dashboard for family context."
        : "Bekijk uw aanbiedersdashboard voor de familiecontext.",
      chosenBody: (family: string) =>
        en
          ? `${family} is choosing to continue with your facility.`
          : `${family} kiest ervoor om verder te gaan met uw locatie.`,
      chosenGuide: en
        ? "A Care Guide is coordinating the final details with the family and your team."
        : "Een Care Guide coördineert de laatste details met de familie en uw team.",
      chosenHint: en
        ? "Open your provider dashboard for the latest inquiry status."
        : "Open uw aanbiedersdashboard voor de laatste status van de aanvraag."
    },
    providerInvite: {
      subject: en
        ? "You're invited to onboard your facility on Shepherds Oud"
        : "U bent uitgenodigd om uw locatie te onboarden bij Shepherds Oud",
      preheader: en
        ? "Finish your Shepherds Oud provider onboarding."
        : "Rond uw Shepherds Oud aanbieder-onboarding af.",
      eyebrow: en ? "Provider invitation" : "Uitnodiging aanbieder",
      title: en ? "Set up your facility profile" : "Richt uw locatieprofiel in",
      facilityFallback: en ? "your facility" : "uw locatie",
      invited: (facility: string) =>
        en
          ? `Your facility, ${facility}, is invited to finish provider onboarding on Shepherds Oud.`
          : `Uw locatie, ${facility}, is uitgenodigd om de aanbieder-onboarding bij Shepherds Oud af te ronden.`,
      hint: en
        ? "Use the secure link below to sign in with this email address and set up your facility profile."
        : "Gebruik de beveiligde link hieronder om in te loggen met dit e-mailadres en uw locatieprofiel in te richten.",
      expires: (label: string) =>
        en ? `This invitation expires on ${label}.` : `Deze uitnodiging verloopt op ${label}.`,
      cta: en ? "Open provider onboarding" : "Open aanbieder-onboarding",
      footerNote: en
        ? "This invitation is only for this email address. Received unexpectedly? You can ignore it."
        : "Deze uitnodiging is alleen bedoeld voor dit e-mailadres. Onverwacht ontvangen? Dan kunt u deze negeren."
    },
    waitlistLaunch: {
      family: {
        subject: en
          ? "Shepherds Oud is live — start your guided care intake"
          : "Shepherds Oud is live — start uw begeleide intake",
        preheader: en
          ? "Guided care navigation is now open on Shepherds Oud."
          : "Begeleide zorgnavigatie is nu open op Shepherds Oud.",
        eyebrow: en ? "We are live" : "Wij zijn live",
        title: en ? "Your guided care journey can begin" : "Uw begeleide zorgreis kan beginnen",
        body: en
          ? [
              "Shepherds Oud is now live. Guided care navigation is open across the Netherlands — for anyone whose mobility limits daily life.",
              "You can start your care intake today. A dedicated Care Guide will personally review your situation, help prepare a care plan, and support you through matching, visits, and placement.",
              "Thank you for waiting with us — we are ready to help you take the next step."
            ]
          : [
              "Shepherds Oud is nu live. Begeleide zorgnavigatie is open in Nederland — voor iedereen bij wie thuis wonen niet meer gaat of mobiliteit het dagelijks leven beperkt.",
              "U kunt vandaag uw zorgintake starten. Een vaste Care Guide beoordeelt uw situatie persoonlijk, helpt bij een zorgplan en begeleidt u bij matching, bezoeken en plaatsing.",
              "Bedankt dat u met ons heeft gewacht — wij helpen u graag met de volgende stap."
            ],
        cta: en ? "Start care intake" : "Start zorgintake",
        footerNote: en
          ? "If you already completed intake, you can sign in from the homepage to view your journey."
          : "Heeft u de intake al afgerond? Log in via de homepage om uw zorgreis te bekijken."
      },
      facility: {
        subject: en
          ? "Shepherds Oud is live — sign in to your facility dashboard"
          : "Shepherds Oud is live — log in op uw locatiedashboard",
        preheader: en
          ? "Provider onboarding is open on Shepherds Oud."
          : "Aanbieder-onboarding is open op Shepherds Oud.",
        eyebrow: en ? "We are live" : "Wij zijn live",
        title: (name: string) =>
          en ? `${name} can now list on Shepherds Oud` : `${name} kan nu vermelden op Shepherds Oud`,
        intro: en
          ? "Shepherds Oud is now live. Care facilities can sign in, list services, and receive matched family inquiries through the provider dashboard."
          : "Shepherds Oud is nu live. Zorglocaties kunnen inloggen, diensten vermelden en gematchte familieaanvragen ontvangen via het aanbiedersdashboard.",
        named: (facility: string) =>
          en
            ? `${facility} can now complete facility onboarding and manage availability, inquiries, and visit requests in one place.`
            : `${facility} kan nu de locatie-onboarding afronden en beschikbaarheid, aanvragen en bezoekverzoeken op één plek beheren.`,
        unnamed: en
          ? "You can now sign in with your work email, complete your facility profile, and start receiving matched family inquiries."
          : "U kunt nu inloggen met uw werk-e-mail, uw locatieprofiel afronden en gematchte familieaanvragen ontvangen.",
        thanks: en
          ? "Thank you for registering before launch — we are glad to welcome you onto the platform."
          : "Bedankt voor uw aanmelding vóór de lancering — welkom op het platform.",
        cta: en ? "Sign in to your facility dashboard" : "Log in op uw locatiedashboard",
        footerNote: en
          ? "Use the same email address you registered with. Need help? Reply to this email or contact our team."
          : "Gebruik hetzelfde e-mailadres als bij aanmelding. Hulp nodig? Beantwoord deze e-mail of neem contact op."
      }
    },
    waitlistAnnouncement: {
      greetingFallback: en ? "there" : "daar",
      facilityFallback: en ? "your facility" : "uw locatie",
      eyebrow: en ? "Shepherds Oud update" : "Update van Shepherds Oud",
      familyCta: en ? "Open Shepherds Oud" : "Open Shepherds Oud",
      facilityCta: en ? "Open facility dashboard" : "Open locatiedashboard",
      footerNote: en
        ? "You are receiving this because you joined the Shepherds Oud waitlist. Reply if you need help."
        : "U ontvangt deze e-mail omdat u zich heeft aangemeld voor de Shepherds Oud-wachtlijst. Antwoord als u hulp nodig heeft."
    }
  };
}
