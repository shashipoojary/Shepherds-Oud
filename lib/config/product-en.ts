import type { productUiNl } from "@/lib/config/product-nl";
import { brand, brandFounderRole, brandRegionNote, brandRegionPrimary } from "@/lib/config/brand";

type ProductUi = typeof productUiNl;

/** English product UI — mirrors productUiNl shape. */
export const productUiEn: ProductUi = {
  intake: {
    stepOf: (current, total) => `Step ${current} of ${total}`,
    back: "Back",
    continue: "Continue",
    submit: "Submit intake",
    update: "Update request",
    submitting: "Submitting intake...",
    updating: "Updating request...",
    notifyingGuide: "Notifying your Care Guide...",
    selectPlaceholder: "Select...",
    specifyOther: "Please specify",
    addDecisionMaker: "Add another decision-maker",
    decisionMakerName: "Name",
    decisionMakerRelationship: "Relationship",
    decisionMakerResponsibilities: "Responsibilities",
    decisionMakerHint: "Add everyone who helps decide about care. At least one is required.",
    decisionMakerN: (n) => `Decision-maker ${n}`,
    remove: "Remove",
    nameExample: "e.g. Maria van den Berg",
    describeRole: "Describe the decision-maker’s role",
    consentRequired: "Please confirm the consent statement before submitting.",
    completeContact: "Please complete your contact details before continuing.",
    completeRequired: "Please complete all required steps before submitting.",
    chooseUpdate: "Choose the care request you want to update from your dashboard.",
    fixFields: "Please fix the highlighted fields.",
    tryAgain: "Please complete the highlighted details and try again.",
    emergencyNotified: "Your Care Guide has been notified. Call 112 if anyone is in immediate danger.",
    optionalSuffix: "(optional)",
    sidebarTitle: "Tell us your situation",
    sidebarIntro: (tagline) =>
      `About 5 minutes. A real Care Guide reviews your case personally — ${tagline}`,
    sidebarUpdateIntro:
      "Update your existing care request. Your Care Guide continues to support shared decisions with you.",
    goToDashboard: "Go to your dashboard",
    backToDashboard: "Back to your dashboard",
    backHome: "Back to home",
    existingRequestHint:
      "You already have a care request saved. Open your dashboard to follow your journey, or continue below to start a new one.",
    waitlistBanner:
      "You’re on our waitlist. Finish this guided intake next so a Care Guide can review your situation.",
    chooseUpdateBanner: "Choose the care request you want to update.",
    openYourRequests: "Open your requests",
    statusUpdated: "Request updated. Opening your dashboard…",
    statusSubmitted: "Intake submitted. Opening your dashboard…",
    emergencyTitle: "Call emergency services first",
    emergencyLead:
      "Shepherds Oud cannot replace emergency help. If someone is unsafe right now, call 112 immediately.",
    emergencyBody:
      "Your situation has been flagged for a Care Guide. They will contact you as soon as possible — but emergency help comes first.",
    emergencyCall112: "Call 112 for police, fire, or ambulance",
    emergencyStay: "Stay with the person if it is safe to do so",
    emergencyFollowUp:
      "A Care Guide will review your flagged intake after the acute situation has been addressed",
    safetyStopTitle: "Stop — call 112 if anyone is in immediate danger",
    safetyStopBody:
      "Based on your answers, this is not a normal care-matching intake. Emergency help comes first. You can still notify a Care Guide so they can follow up after the acute risk is addressed.",
    notifyGuideCta: "Notify Care Guide (flagged intake)"
  },
  family: {
    dashboardTitle: "Family dashboard",
    dashboardSubtitle: "Your guided care journey",
    dashboardIntro: "Follow each step with your dedicated Care Guide — from intake through follow-up.",
    allRequests: "All care requests",
    updateRequest: "Update your request",
    startNewRequest: "Start new request",
    startIntake: "Start intake",
    noRequestYet: "No care request yet",
    noRequestHint: "Complete the intake to create your care request and open matching.",
    questionsTitle: "Questions for your team",
    needToAsk: "Need to ask something?",
    emailCareGuide: "Email Care Guide",
    contactUs: "Contact Shepherds Oud",
    reportConcern: "Report a placement concern",
    caseNotFound: "We could not find that care request on your account. Choose one of your saved requests below.",
    journeyTitle: "Your guided care journey",
    journeyIntro: "A real Care Guide supports you at each step — not an anonymous directory.",
    journeyComplete: "Thank you — this guided care journey is complete.",
    complete: "Complete",
    stepOf: (n, total) => `Step ${n} of ${total}`,
    viewCarePlan: "View care plan",
    viewMatches: "View matches",
    viewVisit: "View visit details",
    successTitle: "We've received your request",
    successGuideAssigned: (name) => `${name} is your Care Guide and will personally review your case.`,
    successGuidePending: "A Care Guide will be assigned shortly.",
    yourReference: "Your reference:",
    yourJourney: "Your care journey",
    resultsChoose: "Choose a care request",
    resultsHeading: "Your matched provider",
    resultsStartHere: "Where we would start",
    resultsOther: "Other places worth a call",
    resultsEmpty: "Your shortlist is almost ready",
    resultsEmptyHint: "Complete your intake first.",
    resultsLoadError: "Could not load your shortlist",
    refresh: "Refresh page",
    whyMatch: "Why this match:",
    careServices: "Care and services:",
    nextStep: "Next step",
    estWait: "Est. wait:",
    priceOnRequest: "Price on request",
    requestVisit: "Request a visit",
    requestCallback: "Request a callback",
    visitRequested: "Visit requested",
    sending: "Sending...",
    readProfile: "Read full profile",
    filterAll: "All options",
    filterAvailable: "Available now",
    filterMemory: "Memory care",
    filterHome: "Home care",
    availabilityNote: "Availability is subject to provider confirmation and eligibility assessment.",
    careGuideAssigned: "Your Care Guide — assigned",
    careGuideSupport: (name) =>
      `${name} personally reviews your case and supports you through assessment, care planning, visits, placement, and follow-up.`,
    providerUpdates: "Provider updates",
    declineRecoveryTitle: "A provider could not accept your latest request",
    viewOtherProviders: "View other providers",
    providerResponse: "Provider response",
    coordinatorTitle: "Your Care Guide coordinates next steps",
    coordinatorDesc:
      "These are updates from providers you chose. Your Care Guide arranges the visit, callback, or next decision with you.",
    previouslyDeclined: "Previously declined",
    viewFullShortlist: "View full shortlist",
    shortlistLabel: "Your shortlist",
    matchedProvidersReady: (n) =>
      `${n} matched provider${n === 1 ? "" : "s"} ready to review`,
    shortlistDeclineHint:
      "Review these alternatives and request a visit or callback when you're ready.",
    shortlistHint: "Review options and request a visit or callback when you're ready.",
    careFacility: "Care facility",
    viewProfile: "View profile",
    viewProvider: "View provider",
    savedOnDevice: "Saved on this device",
    savedProvidersTitle: "Your saved providers",
    savedProvidersDesc:
      "Providers you saved from your shortlist or profile pages. Stored locally in this browser.",
    openProfile: "Open profile",
    savedTipPrefix: "Tip: save providers from your",
    savedTipSuffix: "while comparing options.",
    helpWithGuide: (name) =>
      `Email your Care Guide, ${name}, for updates on your file. For general platform questions, contact the Shepherds Oud team.`,
    helpWithoutGuide: "Email the Shepherds Oud team if you need help while your Care Guide is being assigned.",
    needNewProvider: "Need a new provider?",
    contactGuideAddPrefix: "Contact your Care Guide",
    contactGuideAddSuffix: "— they can add another option to your shortlist.",
    contactWhileAssigningSuffix: "A Care Guide will help once one is assigned.",
    contactViaOr: "or visit the",
    contactViaPrefix: "Contact us at",
    contactPage: "contact page",
    intakeRequestLabel: "Your care request",
    intakeRequestTitle: (name) => `Your care request — ${name}`,
    careGuideUpdates: "Updates from your Care Guide",
    recommendedPathway: "Recommended pathway",
    carePlanSummary: "Care plan summary",
    visitScheduled: "Scheduled visit or callback",
    contactLocation: "Contact & location",
    area: "Area",
    reference: "Reference",
    careNeeded: "Care needed",
    fundingLanguages: "Funding & languages",
    preferences: "Preferences",
    decisionSupport: "Decision support",
    seniorAgreed: "Care recipient agreed",
    participants: "Participants",
    situationNotes: "Situation & notes",
    notes: "Notes",
    safetyCheck: "Safety check",
    moreCount: (n) => `+${n} more`,
    shortlistCount: (n) => `${n} provider${n === 1 ? "" : "s"} on your shortlist.`,
    savedOnAccount: "Saved on your account — expand a section only when you need the details.",
    journeyClosedDesc: "Thank you — this file is closed. Expand to view the completed steps.",
    myRequests: "My care requests",
    pickRequest: "Choose a request to open the care journey.",
    requestCount: (n) => `${n} request${n === 1 ? "" : "s"}`,
    requestStatusActive: (active, history) => `${active} active, ${history} closed`,
    requestStatusInProgress: "in progress",
    requestStatusClosed: "closed",
    noRequestsYet: "No care requests yet. Start a new request to begin.",
    dateUnknown: "Date unknown",
    careRequest: "Care request",
    ageLabel: (range) => `Age ${range}`,
    locationUnknown: "Location not yet known",
    guidePending: "Care Guide being assigned",
    openJourney: "Open care journey",
    update: "Update",
    matchesPerRequest: "Matches are prepared separately for each care request.",
    completeIntakeFirst: "Complete the intake first",
    completeIntakeDesc: "Tell us about your situation so your Care Guide can prepare provider matches.",
    loadErrorDesc: "Check your connection and refresh the page. Your care request remains saved on this device.",
    matchedEmptyDesc:
      "Your Care Guide has matched suitable providers. If nothing appears within a day, contact your Care Guide with your reference number.",
    carePlanReady: "Your care plan is ready",
    carePlanReadyDesc: "Your Care Guide is finalising provider matches for your shortlist.",
    assessmentInProgress: "Your Care Guide is completing your assessment",
    assessmentInProgressDesc: "Once the assessment is ready, we'll publish your care plan and suitable providers here.",
    guideReviewing: "Your Care Guide is reviewing your file",
    guideReviewingDesc: "A real person reviews your intake before the assessment begins.",
    preparingJourney: "We're preparing your care journey",
    preparingJourneyDesc: "Your Care Guide is reviewing your request and will start your assessment soon.",
    matchNotReady: "This match is not ready for requests yet. Return after your Care Guide completes your assessment.",
    visitSentFor: (name) => `Visit request sent for ${name}.`,
    callbackSentFor: (name) => `Callback request sent for ${name}.`,
    historyCaseNote: "This request is closed. Matches are shown for reference only.",
    availabilityConfirmed: (date) => `Availability confirmed ${date}`,
    servicesLanguages: "Services and languages:",
    languages: "Languages:",
    fundingAccepted: "Funding accepted:",
    funding: "Funding:",
    roomTypes: "Room types:",
    quality: "Quality:",
    accessibility: "Accessibility:",
    contactExpectation: "Contact expectation:",
    respondsWithin: (hours) => `Typically responds within ${hours} hours`,
    historyNextStep: "This request is closed. See the final status per provider below.",
    requestVisitOrCallback: "Request a visit or callback; our team helps coordinate with the location.",
    callbackSent: "Callback sent",
    visitSent: "Visit sent",
    profile: "Profile",
    otherProvidersTip: "It helps to have one or two alternatives before deciding.",
    shownOf: (shown, total) => `${shown} of ${total} shown`,
    noFilterMatch: (filter, all) =>
      `No other providers match "${filter}". Try "${all}" for your full shortlist.`,
    rooms: "Rooms:",
    switchCase: "Switch care request",
    reportConcernSubject: "Placement concern report",
    reportConcernBody: (id: string) =>
      `Hello Shepherds Oud,\n\nI would like to report a placement concern for care request ${id}.\n\n`,
    providerDetail: {
      completeIntakeFirst: "Complete the intake form first so we can link your request to this provider.",
      notMatchedYet: "This provider has not been matched to your request yet. Your Care Guide will publish matches first.",
      savedOnDevice: (name) =>
        `${name} saved on this device. Find them under Saved providers on your dashboard.`,
      removedFromSaved: (name) => `${name} removed from your saved providers.`,
      completeIntakeForRequests: "Complete your intake to request visits or callbacks from matched providers.",
      chooseRequestFirst: "Choose a care request first, then open this provider from that request's matches.",
      caseNotFoundOnAccount:
        "We could not find that care request on your account. Open this provider from one of your saved requests.",
      matchNotPublished: "Contact requests open once your Care Guide matches this provider to your intake.",
      chooseAnotherProvider: "Choose another matched provider from your dashboard.",
      statusLabel: (status) => `Status: ${status}.`,
      backToDashboard: "Back to your dashboard",
      backToMatches: "Back to all matches",
      yourDashboard: "Your dashboard",
      savingFavourite: "Saving...",
      savedToFavourites: "Saved to favourites",
      saveToFavourites: "Save to favourites",
      sendingVisitRequest: "Sending visit request...",
      sendingCallbackRequest: "Sending callback request...",
      callbackRequested: "Callback requested",
      chooseCareRequest: "Choose care request",
      careAndServices: "Care and services",
      languagesHeading: "Languages",
      keyDetails: "Key details",
      contactAndNextSteps: "Contact and next steps"
    }
  },
  provider: {
    dashboardTitle: "Provider dashboard",
    inquiries: "Family inquiries",
    inquiriesIntro: "Review matched families, accept or decline requests, and keep availability up to date.",
    availableBeds: "Available beds",
    actionNeeded: "Action needed",
    availability: "Availability",
    profileStatus: "Profile status",
    locked: "Locked",
    complete: "Complete",
    completeProfile: "Complete your facility profile to unlock inquiries",
    openProfile: "Open facility profile",
    noInquiries: "No inquiries yet",
    noInquiriesHint: "Complete your profile to receive care requests.",
    acceptVisit: "Accept visit request",
    decline: "Decline",
    familyDetails: "Family details",
    whatNext: "What happens next",
    facilityProfile: "Facility profile & availability",
    saveProfile: "Save facility profile",
    facilityDetails: "Facility details",
    careProfile: "Care profile",
    pricingResponse: "Pricing & response",
    declineTitle: "Decline this inquiry?",
    declineConfirm: "Decline inquiry",
    tabNew: "New",
    tabOngoing: "Ongoing",
    tabClosed: "Closed",
    tabAll: "All",
    requestFailed: "Request failed.",
    dashboardRefreshed: "Your dashboard has been refreshed.",
    refreshFailed: "Could not refresh the dashboard.",
    loadFailed: "Could not load the provider dashboard.",
    nameMinLength: "Facility name must be at least 2 characters.",
    bedsTotalInvalid: "Total beds must be a whole number (0 or more).",
    bedsOpenInvalid: "Available beds must be a whole number (0 or more).",
    responseTimeInvalid: "Response time must be a whole number of hours.",
    profileReadFailed: "Could not read the saved facility profile.",
    profileSavedComplete: "Facility profile saved. You can now receive care inquiries.",
    profileSavedIncomplete:
      "Facility profile saved. Complete the remaining items to receive care inquiries.",
    profileSaveFailed: "Could not save the facility profile. Check your connection and try again.",
    inquiryUpdateFailed: "Could not update this inquiry. Please try again.",
    inquiryUpdateConnectionFailed:
      "Could not update this inquiry. Check your connection and try again.",
    facilityProfileButton: "Facility profile",
    profileItemsNeededAria: (n) => `${n} profile item${n === 1 ? "" : "s"} still needed`,
    missingCount: (n) => `${n} missing`,
    profileLockHint:
      "Inquiries stay locked until your profile and availability are ready for families and Care Guides.",
    inquiryQueue: "Inquiry queue",
    inquiryQueueIntro:
      "Open an inquiry to review details, accept or decline requests, and follow updates from your Care Guide.",
    inquiryCountInTab: (count, tabLabel) => `${count} in ${tabLabel}`,
    searchPlaceholder: "Search by family name, area, or reference…",
    emptyProfileDescription:
      "Open your facility profile to add contact details, services, care levels, and availability.",
    noInquiriesInTab: (tabLabel) => `No ${tabLabel} inquiries`,
    tryAnotherTab: "Try another tab to see inquiries at a different stage.",
    colFamily: "Family",
    colCareNeeded: "Care needed",
    colLocation: "Location",
    colUpdated: "Updated",
    colStatus: "Status",
    colActions: "Actions",
    open: "Open",
    refLabel: "Ref",
    needHelp: "Need help from Shepherds Oud?",
    supportHint: "Platform or profile questions — not family-specific coordination.",
    emailSupport: "Email support",
    declineDescription:
      "Select a reason. The family and their Care Guide will see that your facility cannot help right now.",
    declineReasonLabel: "Reason for declining",
    visitCallback: "Callback appointment",
    visitOnSite: "Site visit",
    visitWithProvider: (name) => ` with ${name}`,
    nextStepAcceptedVisitTitle: "Visit or call scheduled",
    nextStepAcceptedVisitDesc: "Your Care Guide has arranged the next step with this family.",
    nextStepAcceptedWaitTitle: "Accepted — waiting on Care Guide",
    nextStepAcceptedWaitDesc:
      "No further action is needed right now. The Care Guide will arrange the visit or callback and update you here.",
    nextStepContactedTitle: "Visit or call arranged",
    nextStepContactedDescWithVisit:
      "Confirmed with the family. Use the details below to prepare.",
    nextStepContactedDescNoVisit:
      "The Care Guide has coordinated the next step. Watch for timing details here or by email.",
    nextStepPlacedTitle: "Family choosing your facility",
    nextStepPlacedDesc: "The family is moving forward with your facility. The Care Guide coordinates final details.",
    nextStepDeclinedTitle: "Previously declined",
    nextStepDeclinedDesc:
      "You declined this inquiry earlier. If your Care Guide reopens it after file updates, it will appear under New with accept/decline actions again.",
    nextStepClosedTitle: "Inquiry closed",
    nextStepClosedDesc: "No further action is needed for this family.",
    detailFamilyContact: "Family contact",
    detailPhone: "Phone",
    detailEmail: "Email",
    detailPreferredArea: "Preferred area",
    detailCareNeeded: "Care needed",
    detailUrgency: "Urgency",
    detailAgeRange: "Age range",
    detailMatchScore: "Match score",
    detailStatus: "Status",
    detailReceived: "Received",
    detailLastUpdated: "Last updated",
    detailVisitOrPhone: "Visit or call",
    detailActivity: "Activity",
    inquiryTitleFallback: "Family inquiry",
    inquiryDetailsSubtitle: "Inquiry details",
    accepting: "Accepting...",
    declining: "Declining...",
    footerAccepted: "Accepted — your Care Guide is coordinating next steps.",
    footerContacted: "Visit or call coordinated — watch for timing details here or by email.",
    footerPlaced: "Placement is in progress for this family.",
    footerDeclined: "You declined this inquiry.",
    footerClosed: "This inquiry is closed.",
    footerNoAction: "No action needed at this time.",
    profileSubtitleComplete: "Update how your facility appears to families and Care Guides.",
    profileSubtitleIncomplete: (n) =>
      `${n} item${n === 1 ? "" : "s"} still needed before inquiries unlock.`,
    saving: "Saving...",
    createProfile: "Create facility profile",
    availabilitySectionDesc: "Keep beds and status current so families see accurate capacity.",
    notSetPlaceholder: "Not set",
    availabilityStatusLabel: "Availability status",
    totalBedsLabel: "Total beds or places",
    optionalPlaceholder: "Optional",
    facilityDetailsDesc: "Core details families and Care Guides use to assess fit.",
    facilityNameLabel: "Facility name *",
    facilityTypeLabel: "Facility type",
    contactPersonLabel: "Contact person",
    cityLabel: "City",
    cityPlaceholder: "e.g. Utrecht",
    provinceLabel: "Province",
    descriptionLabel: "Facility description",
    descriptionPlaceholder: "Describe your care approach, environment, and specialisms.",
    careProfileDesc: "Services, languages, and care levels you offer.",
    servicesOfferedLabel: "Services offered",
    careLevelsLabel: "Care levels",
    languagesSpokenLabel: "Languages spoken",
    dementiaCapacityLabel: "Dementia capacity",
    visitAvailabilityLabel: "Visit availability",
    pricingSectionDesc: "Optional details that help families compare options.",
    typicalResponseLabel: "Typical response time (hours)",
    priceMinLabel: "Monthly price min (EUR)",
    priceMaxLabel: "Monthly price max (EUR)",
    fundingAcceptedLabel: "Accepted funding types",
    stillNeededForInquiries: "Still needed for inquiries",
    exampleResponsePlaceholder: "e.g. 24",
    feedbackErrorPrefixes: ["Could", "This inquiry", "Request"]
  },
  auth: {
    emailLabel: "Email address",
    emailLink: "Email me a sign-in link",
    sendingLink: "Sending link...",
    continueGoogle: "Continue with Google",
    redirectingGoogle: "Redirecting to Google…",
    or: "or",
    invalidLink: "That sign-in link is invalid or has expired. Request a new link.",
    invalidEmail: "Enter a valid email address.",
    sendFailed: "Could not send sign-in link.",
    linkSent: (email) => `Sign-in link sent to ${email}. Open it on this device within 15 minutes.`,
    providerInviteHint: "Use the invited facility email to finish onboarding.",
    adminOnly: "Administrator access is limited to approved Care Guide accounts.",
    familyLabel: "For care seekers",
    familyTitle: "Sign in to your care dashboard",
    familyIntro: "Use email or Google to view your care request, Care Guide updates, and provider matches.",
    familyCta: "Complete the intake",
    familyStarting: "Starting a new request?",
    loadingSignIn: "Loading sign-in...",
    providerLabel: "For care facilities",
    providerTitle: "List your facility on Shepherds Oud",
    providerIntro: "Sign in with your work email or Google to manage your facility profile, availability, and family inquiries.",
    providerWaitlist: "Join the facility waitlist",
    providerNotReady: "Not ready to list yet?",
    backHome: "Back to homepage",
    adminLabel: "Care Guide sign in",
    adminTitle: "Sign in to Shepherds Oud",
    adminIntro: "Use your approved Google account to access the Care Guide dashboard.",
    providerAccountNeeded:
      "You need a facility account for this page. Use List your facility to sign in.",
    oauthNotConfigured:
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel and redeploy.",
    oauthFailed: "Google sign-in could not be completed. Try again or contact support.",
    providerNotApproved: "Your facility account is not approved yet.",
    workEmailHint: "Use your work email — Gmail, Microsoft, Apple, or your organisation domain.",
    providerAccountNotFound:
      "No facility account was found for this email. Join the provider waitlist — once Shepherds Oud invites you, you can sign in here.",
    providerInvitePending:
      "You have a pending invitation. Open the invite link from your Shepherds Oud email first, then sign in here.",
    providerInviteExpired:
      "This invitation link has expired. Contact Shepherds Oud support for a new invite.",
    providerInviteEmailMismatch:
      "This invitation belongs to a different email address. Sign in with the email from your Shepherds Oud invite."
  },
  matchScore: {
    strongMatch: "Strong match for your situation",
    goodOption: "Good option to explore",
    worthConversation: "Worth a conversation",
    percentAlignment: (score: number) => `${score}% alignment`,
    percentFitAria: (score: number) => `${score} percent fit`
  },
  userMenu: {
    loadingAccount: "Loading account...",
    loading: "Loading...",
    careFacilities: "Care facilities",
    prelaunchProviderHint:
      "Provider sign-in opens at launch. Register your facility interest now and we will contact you when onboarding is ready.",
    registerFacility: "Register your facility",
    yourAccount: "Your account",
    providerSignInHint: "Facility sign-in to manage your profile, availability, and inquiries.",
    facilitySignIn: "Facility sign in",
    accountFallback: "Account",
    openDashboard: "Open dashboard",
    signingOut: "Signing out...",
    signOut: "Sign out",
    openProfileMenu: "Open profile menu",
    getStarted: "Get started",
    roleAdmin: "Administrator",
    roleProvider: "Care provider",
    roleFamily: "Family account"
  },
  waitlist: {
    facilityName: "Facility name",
    contactPerson: "Contact person",
    yourName: "Your name",
    email: "Email address",
    phone: "Phone number",
    city: "City",
    province: "Province",
    cityPlaceholder: "e.g. The Hague",
    relationship: "Relationship to the person needing care",
    relationshipPlaceholder: "Self, child, partner, etc.",
    ageRange: "Age range",
    agePlaceholder: "Select age range",
    careTypes: "Type of care needed",
    facilityType: "Facility type",
    registrationNumber: "Chamber of Commerce / registration number",
    registrationPlaceholder: "e.g. 12345678",
    registrationHint: "For verification before onboarding. We check this manually.",
    bedsOptional: "Number of beds or places (optional)",
    services: "Services offered",
    message: "Anything else we should know?",
    messagePlaceholder: "Briefly describe your situation or facility.",
    submit: "Register",
    submitting: "Sending...",
    fixFields: "Please fix the highlighted fields.",
    saveFailed: "Could not save your registration. Please try again."
  },
  validation: {
    required: "Required",
    tooShort: "Too short",
    invalidEmail: "Invalid email address",
    consentRequired: "Consent is required before submitting your care request.",
    selectCareType: "Select at least one care type",
    addDecisionMaker: "Add at least one decision-maker",
    nameRequired: "Name is required",
    relationshipRequired: "Relationship is required",
    registrationNumber: "Enter your KVK or government registration number",
    facilityNameMin: "Facility name must be at least 2 characters.",
    bedsWhole: "Total beds must be a whole number (0 or more).",
    bedsNegative: "Total beds cannot be negative.",
    bedsOpenWhole: "Available beds must be a whole number (0 or more).",
    bedsOpenNegative: "Available beds cannot be negative.",
    responseTimeWhole: "Response time must be a whole number of hours.",
    responseTimeMin: "Response time must be at least 1 hour.",
    responseTimeMax: "Response time cannot be more than 168 hours (1 week).",
    priceMinNegative: "Minimum price cannot be negative.",
    priceMaxNegative: "Maximum price cannot be negative."
  },
  nav: {
    home: "Home",
    waitlist: "Waitlist",
    forFamilies: "For families",
    forProviders: "For providers",
    faq: "FAQ",
    forInternationals: "For internationals",
    contact: "Contact",
    startIntake: "Start intake",
    howItWorks: "How it works",
    about: "About",
    call: "Call",
    openMenu: "Open menu",
    mainMenu: "Main menu",
    myFacility: "My facility",
    adminPanel: "Admin",
    viewSite: "View site",
    adminMenu: "Admin menu"
  },
  footer: {
    navAria: "Footer navigation",
    legal: "Legal",
    legalAria: "Legal",
    prelaunchBlurb: (regionNote: string) =>
      `Guided care navigation when living at home is no longer possible. ${regionNote} Register now.`,
    liveBlurb: (regionPrimary: string) =>
      `Guided care navigation — not a directory. Care Guide, matching and follow-up in ${regionPrimary}.`,
    copyrightSuffix: "Care navigation in the Netherlands.",
    prelaunchStatus: "Pre-launch — guided intake opening soon",
    liveStatus: "For families and care providers.",
    legalLabel: (href: string, fallback: string) =>
      (
        {
          "/privacy": "Privacy",
          "/terms": "Terms",
          "/cookies": "Cookies",
          "/complaints": "Complaints",
          "/data-deletion": "Data deletion",
          "/accessibility": "Accessibility",
          "/company": "Company details"
        } as Record<string, string>
      )[href] || fallback
  },
  common: {
    families: "Families",
    careProviders: "Care providers",
    registerInterest: "Register interest",
    startIntake: "Start intake",
    pricingTerms: "Pricing & terms",
    registerLocation: "Register your location",
    backHome: "Back to home",
    readMore: "Read more:",
    email: "Email",
    waitlist: "Waitlist",
    familyWaitlist: "Family waitlist",
    providerWaitlist: "Provider waitlist",
    earlyRegistration: "Early registration",
    mailPrefix: "Mail"
  },
  pages: {
    about: {
      metaTitle: `About | ${brand.name}`,
      metaDescription:
        "Guided care navigation when living at home is no longer possible — Care Guide, matching and follow-up in The Hague / Haaglanden region.",
      label: "About",
      title: "Care navigation with a human guide",
      intro: `${brand.name} helps families when living at home is no longer possible — with dementia, after hospital, or when home care is no longer enough. We are not a directory. Every journey starts with a Care Guide who listens, assesses, and coordinates with suitable providers.`,
      sections: [
        {
          title: "Who we help",
          paragraphs: [
            "Adult children and families looking for the next step: nursing home, care villa, or more intensive support at home. Even when the person is still mobile — dementia often requires different care than mobility alone.",
            "Families often reach out when decisions feel urgent, confusing, or emotionally heavy. We stay with you from first intake through placement and follow-up at 7, 30, and 90 days."
          ]
        },
        {
          title: "What makes us different",
          list: [
            "A guided journey — not a directory or endless search list",
            "Free for families; transparently paid by participating providers",
            "One dedicated Care Guide from intake through follow-up",
            "Regional focus: The Hague / Haaglanden, then nationwide",
            "Help with Dutch terms: Wlz, Wmo, CIZ, PGB, eigen bijdrage, zorgkantoor"
          ],
          paragraphs: [] as string[]
        },
        {
          title: `Your Care Guide: ${brand.founderName}`,
          paragraphs: [
            `${brand.founderName} (${brandFounderRole("en")}) built Shepherds Oud because families in crisis get lost between directories and paperwork. Guidance from care professionals who know the Dutch system — from CIZ applications to choosing between home care, a care villa, or a nursing home.`,
            brandRegionNote("en")
          ]
        }
      ],
      cta: "How it works"
    },
    howItWorks: {
      metaTitle: `How it works | ${brand.name}`,
      metaDescription:
        "Step by step: intake, Care Guide, matching, visits, placement and follow-up at 7, 30 and 90 days.",
      label: "How it works",
      title: "From first conversation to the right care",
      intro: `${brand.name} is a guided journey — not a directory. You always know the next step and who is helping you. ${brandRegionNote("en")}`,
      sections: [
        {
          title: "1. Tell us your situation",
          paragraphs: [
            "Complete the guided intake in about 10–15 minutes: who needs care, dementia or care needs, urgency, funding (Wlz / Wmo / PGB), language, and who helps decide.",
            "You can save progress and continue later when signed in."
          ]
        },
        {
          title: "2. Meet your Care Guide",
          paragraphs: [
            "A Care Guide calls within 24 hours, reviews your file, and helps clarify goals, budget, and practical requirements (distance, language, dementia capacity)."
          ]
        },
        {
          title: "3. View your shortlist",
          paragraphs: [
            "When the care plan is ready, you see matched providers — not an endless search list. Availability and wait times where known, plus the option to save favourites."
          ]
        },
        {
          title: "4. Visits, placement, and follow-up",
          paragraphs: [
            "Your Care Guide coordinates visits or callback appointments. Status updates appear on your dashboard.",
            "After placement we stay involved: check-ins at 7, 30, and 90 days — with the same Care Guide. If a provider declines, your file stays open."
          ]
        }
      ]
    },
    contact: {
      metaTitle: `Contact | ${brand.name}`,
      metaDescription: `Contact ${brand.name} for guided care navigation in the ${brand.regionPrimaryEn} region.`,
      label: "Contact",
      title: "We're here to help",
      intro:
        "Whether you're seeking care for a loved one, need help yourself, or want to list a facility — call or email us. A Care Guide will call back within 24 hours.",
      phoneHint: "For families in crisis — call first if a form feels too heavy right now.",
      familiesPrelaunch: "Matching starts at launch. Register your interest; we'll contact you.",
      familiesLive: "Start the intake online, or call the Care Guide line if you'd rather talk first.",
      providersBlurb: "Free to list, pay on placement. Read the terms or register your location.",
      emailHint: "Response within one business day — or faster via the Care Guide line.",
      englishPage: "English page"
    },
    faq: {
      metaTitle: `FAQ | ${brand.name}`,
      metaDescription:
        "FAQ about Shepherds Oud: Wlz, Wmo, CIZ, PGB, eigen bijdrage, Care Guide, costs for families and follow-up.",
      label: "FAQ",
      title: "Frequently asked questions",
      intro:
        "About guided care navigation, costs, and Dutch terms such as Wlz, Wmo, CIZ, PGB, and eigen bijdrage.",
      internationalsLead: "International in The Hague?",
      items: [
        {
          q: "What is Shepherds Oud?",
          a: "A guided care navigation service — not a directory. You get one Care Guide who helps from intake through placement and follow-up (7, 30, and 90 days), when living at home is no longer possible."
        },
        {
          q: "Is it free for families?",
          a: "Yes. Families pay us nothing. Shepherds Oud is compensated by participating care providers. Your options are never limited to only paying providers."
        },
        { q: "Where are you active?", a: brandRegionNote("en") },
        {
          q: "How is this different from Filica or ZorgkaartNederland?",
          a: "Those platforms are mainly directories. We match, coordinate visits, and stay involved after placement. A directory stops at the list; we guide the journey."
        },
        {
          q: "What is CIZ?",
          a: "The Centrum Indicatiestelling Zorg (Centre for Indication of Care). For heavy, long-term care (Wlz), CIZ assesses whether you are entitled to an indication."
        },
        {
          q: "What is Wlz?",
          a: "The Wet langdurige zorg (Long-term Care Act) — for people who need permanent intensive care, for example in a nursing home or via 24-hour care at home."
        },
        {
          q: "What is Wmo?",
          a: "The Wet maatschappelijke ondersteuning (Social Support Act) — municipal support to stay at home as long as possible (help at home, day activities, home adaptations)."
        },
        {
          q: "What is PGB?",
          a: "Persoonsgebonden budget (personal budget): you receive budget to purchase care yourself, instead of care in kind via a provider."
        },
        {
          q: "What is eigen bijdrage?",
          a: "The part you (or your family) contribute to Wlz or Wmo care. The amount depends on income, assets, and situation. We help interpret the letter; formal calculation is by CAK / municipality."
        },
        {
          q: "What does the zorgkantoor do?",
          a: "The zorgkantoor (care office) contracts Wlz providers in a region and helps find suitable care within your indication."
        },
        {
          q: "How quickly will you contact me?",
          a: "A Care Guide calls within 24 hours of your request (on business days)."
        },
        {
          q: "Who is my Care Guide?",
          a: `${brand.founderName} (${brandFounderRole("en")}) and the team personally guide cases. Guidance from care professionals who know the Dutch system — not an anonymous call centre line.`
        }
      ]
    },
    providers: {
      metaTitle: `For care providers | ${brand.name}`,
      metaDescription:
        "List for free on Shepherds Oud. Pay only on successful placement. Pre-matched family inquiries in The Hague / Haaglanden region.",
      label: "Care providers",
      title: "Free to list. Pay on placement.",
      intro: `${brand.name} is not a subscription directory. You are visible without a monthly listing fee. We only earn when there is a successful placement — transparent for families and providers.`,
      whatYouGetTitle: "What you get",
      whatYouGet: [
        "Pre-matched families (care type, language, dementia capacity, availability)",
        "Dashboard to accept, decline, or follow up on leads",
        `Focus region ${brandRegionPrimary("en")}, then nationwide expansion`,
        "No endless cold leads from an open directory"
      ],
      compensationTitle: "Compensation",
      compensationLead:
        "Exact placement fees are agreed per care type and region during onboarding. The principle remains:",
      compensationBold: " free to be visible, pay on results",
      forFamiliesTitle: "For families",
      forFamilies: "Families pay us nothing. Their choices are never limited to only paying providers.",
      registerCta: "Register your location"
    },
    register: {
      metaTitle: `Register | ${brand.name}`,
      metaDescription: `Register your interest with ${brand.name} — for families or care providers.`,
      waitlistLabel: "Waitlist",
      registerInterestTitle: "Register your interest",
      registerInterestDesc: (regionNote: string) =>
        `Not ready for the full intake yet? Register your interest. ${regionNote}`,
      familiesPrelaunch:
        "Register when living at home is no longer possible — with dementia, after hospital, or when home care is no longer enough.",
      familiesWaitlist: "Join the waitlist, or start the guided intake directly.",
      providersBlurb: "Free to list, pay on placement. Register your location or read the terms first."
    },
    registerFamily: {
      metaTitle: `Family waitlist | ${brand.name}`,
      metaDescription: "Register interest in guided care navigation for your family.",
      label: "Family waitlist",
      title: "Register interest in care guidance",
      introPrelaunch: (regionNote: string) =>
        `Tell us briefly about your situation when living at home is no longer possible. ${regionNote} We'll contact you when matching starts.`,
      introWaitlist: (regionNote: string) =>
        `Register your interest; we'll contact you. Ready for guided navigation? Start the intake separately. ${regionNote}`
    },
    registerFacility: {
      metaTitle: `Provider waitlist | ${brand.name}`,
      metaDescription: "Register your care location — free to list, pay on placement.",
      label: "Provider waitlist",
      title: "Register your care location",
      introLead: "Free to list, pay on placement.",
      readPricing: "Read pricing & terms"
    },
    registerSuccess: {
      title: "You're on the waitlist",
      familyBody: "Thank you for registering. We'll contact you as soon as Shepherds Oud can guide you.",
      facilityBody:
        "Thank you for registering your location. We'll contact you when provider onboarding starts."
    },
    home: {
      metaTitle: brand.name,
      metaDescription:
        "Guided care navigation when living at home is no longer possible — Care Guide, matching and follow-up in The Hague / Haaglanden region.",
      heroSubline:
        "When living at home is no longer possible — with dementia, after hospital, or when home care is no longer enough.",
      registerInterest: "Register interest",
      preferEmail: "Prefer email? ",
      forFamilies: "For families",
      forCareProviders: "For care providers",
      familiesPrelaunch:
        "Register your interest. At launch a Care Guide will personally review your situation.",
      familiesLive: "Start the intake. A Care Guide calls within 24 hours and supports you through follow-up.",
      providersCard: "List for free. Pay only on placement. Receive pre-matched family inquiries.",
      viewTerms: "View terms",
      howItWorksLabel: "How it works",
      howItWorksTitle: "A guided journey — not a directory",
      howItWorksDesc:
        "From first conversation to placement and follow-up — with one dedicated contact. No endless search lists like Filica or ZorgkaartNederland.",
      trustLabel: "Trust",
      faqLead: "Questions about Wlz, Wmo, CIZ, PGB or eigen bijdrage? ",
      viewFaq: "View the FAQ",
      earlyAccessLabel: "Early access",
      lookingForCare: "Looking for care?",
      familiesPrelaunchCard: "Register your interest; we will contact you when matching starts.",
      listLocation: "List your location?",
      providersPrelaunchCard: "Register for free. Pay only on placement.",
      getStartedLabel: "Get started",
      readyToBegin: "Ready to begin?",
      familiesLiveCard: "Complete the intake — a Care Guide calls within 24 hours.",
      listForFree: "List for free",
      providersLiveCard: "Pay only on successful placement. Read the terms.",
      providersSectionLabel: "Providers",
      providersSectionTitle: "For care providers",
      providersSectionDesc: "Reach families that truly fit — list for free, pay on placement.",
      registerYourLocation: "Register your location"
    }
  }
};

export const journeyEn: Record<string, { label: string; hint: string }> = {
  NEW: {
    label: "Request received",
    hint: "We received your care request and are preparing your file."
  },
  CARE_GUIDE_ASSIGNED: {
    label: "Care Guide assigned",
    hint: "A real person is now reviewing your case and will guide you through each decision."
  },
  ASSESSMENT: {
    label: "Assessment",
    hint: "Your Care Guide is learning about the person's needs, urgency, and decision context."
  },
  CARE_PLAN: {
    label: "Care plan",
    hint: "Your Care Guide has prepared a recommended pathway and next steps for you."
  },
  MATCHED: {
    label: "Providers matched",
    hint: "Suitable providers are on your shortlist. Your Care Guide helps you compare options."
  },
  VISIT_SCHEDULED: {
    label: "Visit scheduled",
    hint: "A facility visit or callback is booked and tracked."
  },
  PROVIDER_RESPONSE: {
    label: "Provider response",
    hint: "A provider has accepted or responded. Your Care Guide coordinates next steps."
  },
  PLACEMENT_IN_PROGRESS: {
    label: "Placement in progress",
    hint: "Care arrangement is moving forward with admission or move-in."
  },
  PLACED: {
    label: "Care arranged",
    hint: "Care has been secured. Your Care Guide remains available during the transition."
  },
  FOLLOW_UP_7: {
    label: "7-day follow-up",
    hint: "Your Care Guide checks in one week after placement."
  },
  FOLLOW_UP_30: {
    label: "30-day follow-up",
    hint: "Your Care Guide checks in one month after placement."
  },
  FOLLOW_UP_90: {
    label: "90-day follow-up",
    hint: "Your Care Guide checks in three months after placement."
  },
  CLOSED: {
    label: "Complete",
    hint: "This care journey is closed."
  }
};
