import type { productUiNl } from "@/lib/config/product-nl";
import { brand, brandFounderRole, brandRegionNote } from "@/lib/config/brand";

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
      "Shepherds Oud Care cannot replace emergency help. If someone is unsafe right now, call 112 immediately.",
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
    contactUs: "Contact Shepherds Oud Care",
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
    waitAskCareGuide: "Ask your Care Guide for current wait times",
    waitEstimateSourceLabel: "Provider-reported estimate",
    otherMatchedOptionsTitle: "Other options your Care Guide matched",
    otherMatchedOptionsTip:
      "Your top option has limited or unknown wait timing — review these other matches from your Care Guide.",
    priceOnRequest: "Price on request",
    requestVisit: "Request a visit",
    requestCallback: "Request a callback",
    notInterested: "Not interested",
    passedOnProvider: (name) => `Passed on ${name}.`,
    passedOptions: "Passed options",
    earlierOptions: "Earlier options",
    earlierOptionsHint: "Providers you passed on or that could not take this request.",
    passedAsideHint: "Your Care Guide can add these again if you change your mind.",
    notInterestedConfirmTitle: "Pass on this provider?",
    notInterestedConfirmDesc:
      "This removes them from your active shortlist. Your Care Guide can add them again later if you change your mind.",
    notInterestedConfirm: "Yes, pass",
    cancel: "Cancel",
    passedEmptyHint: "No active matches right now. Passed options stay listed below so you can review them with your Care Guide.",
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
      `Email your Care Guide, ${name}, for updates on your file. For general platform questions, contact the Shepherds Oud Care team.`,
    helpWithoutGuide: "Email the Shepherds Oud Care team if you need help while your Care Guide is being assigned.",
    needNewProvider: "Need a new provider?",
    contactGuideAddPrefix: "Contact your Care Guide",
    contactGuideAddSuffix: "— they can add another option to your shortlist.",
    contactWhileAssigningSuffix: "A Care Guide will help once one is assigned.",
    contactViaOr: "or visit the",
    contactViaPrefix: "Contact us at",
    contactPage: "contact page",
    fundingEstimateCta: "Care funding estimate",
    fundingEstimateHint: "Compare your budget band with typical listed facility prices.",
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
      `Hello Shepherds Oud Care,\n\nI would like to report a placement concern for care request ${id}.\n\n`,
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
      sendingPass: "Updating...",
      callbackRequested: "Callback requested",
      notInterested: "Not interested",
      chooseCareRequest: "Choose care request",
      careAndServices: "Care and services",
      languagesHeading: "Languages",
      keyDetails: "Key details",
      waitEstimateHeading: "Wait time",
      contactAndNextSteps: "Contact and next steps"
    }
  },
  provider: {
    dashboardTitle: "Provider dashboard",
    inquiries: "Family inquiries",
    inquiriesIntro: "Accept or decline requests and keep capacity up to date.",
    occupancyTitle: "Occupancy",
    occupancyIntro: "Current capacity at your facility. Update beds and wait estimates in your facility profile.",
    occupancyPercentLabel: "Occupied",
    occupancyBedsLabel: "Beds open",
    occupancyBedsOfTotal: (open, total) => `${open} / ${total}`,
    occupancyOccupiedCount: (occupied, total) => `${occupied} / ${total}`,
    occupancyNoBeds: "Set beds in profile",
    occupancyAvailability: "Availability",
    occupancyWaitEstimate: "Wait",
    occupancyWaitFresh: "Live for families",
    occupancyWaitStale: "Stale — refresh",
    occupancyWaitUnset: "Not set",
    occupancyEditCapacity: "Edit",
    insightsTitle: "Recent activity",
    insightsIntro:
      "Recent inquiry updates. Counts and acceptance rate are in the summary above — acceptance is approximate because rematched inquiries may overwrite earlier decisions.",
    insightsActionNeeded: "Action needed",
    insightsOngoing: "Ongoing",
    insightsClosed: "Closed",
    insightsAcceptanceRate: "Acceptance rate",
    insightsAcceptanceApprox: (percent) => `${percent}%`,
    insightsAcceptanceEmpty: "No accept or decline decisions yet",
    insightsRecentTitle: "Recent activity",
    insightsRecentEmpty: "No inquiry activity yet.",
    insightsOpenInquiry: "Open",
    occupancyBedsMismatch: "Check bed totals in profile",
    detailDeclineReason: "Decline reason",
    contactFamilyTitle: "Contact this family",
    contactCall: "Call",
    contactEmail: "Email",
    contactCopyPhone: "Copy phone",
    contactCopyEmail: "Copy email",
    contactCopied: "Copied",
    websiteLabel: "Website",
    websitePlaceholder: "https://…",
    roomTypesLabel: "Room types",
    roomTypesHelper: "Optional labels (comma-separated), e.g. Single, Double, Shared. Not a room inventory.",
    roomTypesPlaceholder: "e.g. Single, Double",
    availableBeds: "Available beds",
    actionNeeded: "Action needed",
    availability: "Availability",
    profileStatus: "Profile status",
    locked: "Locked",
    complete: "Complete",
    completeProfile: "Complete your facility profile",
    openProfile: "Open facility profile",
    noInquiries: "No inquiries yet",
    noInquiriesHint: "New family requests will show up here.",
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
    inquiryQueueIntro: "Open an inquiry to accept, decline, or follow Care Guide updates.",
    inquiryCountInTab: (count, tabLabel) => `${count} in ${tabLabel}`,
    searchPlaceholder: "Search by family name, area, or reference…",
    emptyProfileDescription: "Finish the items above to unlock this queue.",
    noInquiriesInTab: (tabLabel) => `No ${tabLabel} inquiries`,
    tryAnotherTab: "Try another tab.",
    colFamily: "Family",
    colCareNeeded: "Care needed",
    colLocation: "Location",
    colUpdated: "Updated",
    colStatus: "Status",
    colActions: "Actions",
    open: "Open",
    refLabel: "Ref",
    needHelp: "Need help from Shepherds Oud Care?",
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
    profileSubtitleComplete: "Update how your facility appears for crisis triage referrals.",
    profileSubtitleIncomplete: (n) =>
      `${n} item${n === 1 ? "" : "s"} still needed before your profile is complete.`,
    saving: "Saving...",
    createProfile: "Create facility profile",
    availabilitySectionDesc: "Keep beds and status current so families see accurate capacity.",
    notSetPlaceholder: "Not set",
    availabilityStatusLabel: "Availability status",
    totalBedsLabel: "Total beds or places",
    waitEstimateSectionTitle: "Wait time estimate",
    waitEstimateSectionDesc:
      "Let families know roughly how long the wait typically is — update this regularly for accuracy.",
    waitEstimateMinLabel: "Estimated wait min (days)",
    waitEstimateMaxLabel: "Estimated wait max (days)",
    waitEstimateHelper: "Optional. Shown to families only while fresh (updated within 30 days).",
    waitEstimateStalePrompt: (days: number) =>
      days <= 0
        ? "Last updated today — still looks current."
        : `Last updated ${days} day${days === 1 ? "" : "s"} ago — consider refreshing for accuracy.`,
    waitEstimateStaleForFamilies: "Families currently see “Ask your Care Guide” because this estimate is older than 30 days.",
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
    stillNeededForInquiries: "Still needed for your profile",
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
    providerTitle: "List your facility on Shepherds Oud Care",
    providerIntro: "Sign in with your work email or Google to manage your facility profile, availability, and family inquiries.",
    providerWaitlist: "Join the facility waitlist",
    providerNotReady: "Not ready to list yet?",
    backHome: "Back to homepage",
    adminLabel: "Care Guide sign in",
    adminTitle: "Sign in to Shepherds Oud Care",
    adminIntro: "Use your approved Google account to access the Care Guide dashboard.",
    providerAccountNeeded:
      "You need a facility account for this page. Use List your facility to sign in.",
    oauthNotConfigured:
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel and redeploy.",
    oauthFailed: "Google sign-in could not be completed. Try again or contact support.",
    providerNotApproved: "Your facility account is not approved yet.",
    workEmailHint: "Use your work email — Gmail, Microsoft, Apple, or your organisation domain.",
    providerAccountNotFound:
      "No facility account was found for this email. Join the provider waitlist — once Shepherds Oud Care invites you, you can sign in here.",
    providerInvitePending:
      "You have a pending invitation. Open the invite link from your Shepherds Oud Care email first, then sign in here.",
    providerInviteExpired:
      "This invitation link has expired. Contact Shepherds Oud Care support for a new invite.",
    providerInviteEmailMismatch:
      "This invitation belongs to a different email address. Sign in with the email from your Shepherds Oud Care invite."
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
    roleHospital: "Hospital referrer",
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
    priceMaxNegative: "Maximum price cannot be negative.",
    waitEstimateWhole: "Wait estimate must be a whole number of days (0 or more).",
    waitEstimateNegative: "Wait estimate cannot be negative.",
    waitEstimateBothRequired: "Enter both a minimum and maximum wait estimate in days, or leave both empty.",
    waitEstimateMinMaxOrder: "Minimum wait days cannot be greater than maximum wait days."
  },
  nav: {
    home: "Home",
    waitlist: "Waitlist",
    forFamilies: "For families",
    forProviders: "For providers",
    faq: "FAQ",
    forInternationals: "For internationals",
    contact: "Contact",
    startIntake: "Start triage",
    directory: "Directory",
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
    liveBlurb: (_regionPrimary: string) =>
      "Crisis triage, next-step checklists, and a Haaglanden care directory — free for families across the Netherlands.",
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
  dbColdStart: {
    reconnecting: "Reconnecting to database",
    almostThere: "Database waking up — almost there"
  },
  common: {
    families: "Families",
    careProviders: "Care providers",
    registerInterest: "Register interest",
    startIntake: "Start triage",
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
        "Shepherds Oud Care helps families with urgent eldercare — triage, checklist, and Haaglanden directory.",
      label: "About",
      title: "Care navigation when it suddenly becomes urgent",
      intro: `${brand.name} helps older adults' families act fast: short triage, a recommended path, a trackable checklist, and a Haaglanden provider directory. Free for families. Human support by phone or email when you need it.`,
      sections: [
        {
          title: "Who we help",
          paragraphs: [
            "Families facing a sudden care decision — after a fall, hospital discharge, or rapid decline — who need a clear first path.",
            "You can start triage without an account, then save a checklist and browse Haaglanden providers when you are ready."
          ]
        },
        {
          title: "What makes us different",
          list: [
            "Crisis triage first — not an endless search list",
            "Free for families; transparent success-fee disclosure for providers",
            "Checklists that link to official portals you complete yourself",
            "Haaglanden directory with introductions from your case",
            "Human support by phone or email when a form feels too heavy"
          ],
          paragraphs: [] as string[]
        },
        {
          title: `Built by ${brand.founderName}`,
          paragraphs: [
            `${brand.founderName} (${brandFounderRole("en")}) built Shepherds Oud Care because families in crisis get lost between directories and paperwork. Start online in minutes; reach a person when you need one.`,
            brandRegionNote("en")
          ]
        }
      ],
      cta: "How it works"
    },
    howItWorks: {
      metaTitle: `How it works | ${brand.name}`,
      metaDescription:
        "Crisis triage, recommended path, checklist, Haaglanden directory, and official portal steps — free for families.",
      label: "How it works",
      title: "How Shepherds Oud Care works",
      intro: `${brand.name} helps you act when eldercare suddenly becomes urgent. Start online without an account, get a recommended path, then track next steps and browse local providers.`,
      sections: [
        {
          title: "1. Start triage",
          paragraphs: [
            "Answer five short questions about urgency, living situation, and funding. No login required to begin."
          ]
        },
        {
          title: "2. See your recommended path",
          paragraphs: [
            "Receive a clear direction — home care first, facility admission, both, or gather information — with software-generated reasoning you can read in Dutch or English."
          ]
        },
        {
          title: "3. Save your result",
          paragraphs: [
            "Create a family account, confirm who you act for (including bewindvoerder / mentor when relevant), and unlock your checklist."
          ]
        },
        {
          title: "4. Browse the Haaglanden directory",
          paragraphs: [
            "Filter home-care and residential providers, then request an introduction linked to your case. Success-fee disclosure is shown in-product."
          ]
        },
        {
          title: "5. Act on official portals yourself",
          paragraphs: [
            "Checklist steps link to CIZ, DigiD, gemeente, and related resources. We never submit those forms for you."
          ]
        }
      ]
    },
    contact: {
      metaTitle: `Contact | ${brand.name}`,
      metaDescription: `Contact ${brand.name} for crisis triage support and care navigation in the Netherlands.`,
      label: "Contact",
      title: "We're here to help",
      intro:
        "Start triage online, browse the directory, or call/email if a form feels too heavy. We respond as quickly as we can.",
      phoneHint: "For families in crisis — call first if a form feels too heavy right now.",
      familiesPrelaunch: "Matching starts at launch. Register your interest; we'll contact you.",
      familiesLive: "Start triage online, or call/email us if you'd rather talk first.",
      providersBlurb: "Free to list, pay on placement. Read the terms or register your location.",
      emailHint: "Response within one business day — or call for urgent family situations.",
      englishPage: "English page",
      fundingEstimateLead: "Want a rough sense of facility prices versus your budget?",
      fundingEstimateCta: "Open the care funding estimate"
    },
    faq: {
      metaTitle: `FAQ | ${brand.name}`,
      metaDescription:
        "FAQ about Shepherds Oud Care: Wlz, Wmo, CIZ, PGB, eigen bijdrage, Care Guide, costs for families and follow-up.",
      label: "FAQ",
      title: "Frequently asked questions",
      intro:
        "About guided care navigation, costs, and Dutch terms such as Wlz, Wmo, CIZ, PGB, and eigen bijdrage.",
      internationalsLead: "International in the Netherlands?",
      fundingSectionTitle: "Funding & costs",
      fundingToolLead:
        "Compare your budget band with typical monthly prices listed by providers — educational only, not CAK or Wmo guidance.",
      fundingToolCta: "Open the care funding estimate",
      items: [
        {
          q: "What is Shepherds Oud Care?",
          a: "Shepherds Oud Care helps families act when eldercare suddenly becomes urgent. You start a short triage, get a recommended path, track next steps with a checklist, and browse Haaglanden providers. Free for families. We do not submit CIZ, DigiD, or gemeente forms for you."
        },
        {
          q: "Is it free for families?",
          a: "Yes. Families pay us nothing. Some providers may pay a success fee if a placement starts through our directory — that does not change which options we show."
        },
        { q: "Where are you active?", a: brandRegionNote("en") },
        {
          q: "How is this different from Filica or ZorgkaartNederland?",
          a: "Those platforms are mainly directories. We start with triage and a checklist of next steps, then help you contact local providers from your case — with clear fee disclosure."
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
          q: "Can I get a rough cost estimate?",
          a: "Yes. Use the care funding estimate tool to compare your budget band with typical monthly prices listed by providers on Shepherds Oud Care. It is educational only — not official CAK, Wmo, or insurance guidance. Your Care Guide confirms exact costs for your situation."
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
        "List for free on Shepherds Oud Care. Pay only on successful placement. Pre-matched family inquiries across the Netherlands.",
      label: "Care providers",
      title: "Free to list. Pay on placement.",
      intro: `${brand.name} is not a subscription directory. You are visible without a monthly listing fee. We only earn when there is a successful placement — transparent for families and providers.`,
      whatYouGetTitle: "What you get",
      whatYouGet: [
        "Pre-matched families (care type, language, dementia capacity, availability)",
        "Dashboard to accept, decline, or follow up on leads",
        "Coverage across the Netherlands",
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
      familyBody: "Thank you for registering. We'll contact you as soon as Shepherds Oud Care can guide you.",
      facilityBody:
        "Thank you for registering your location. We'll contact you when provider onboarding starts."
    },
    home: {
      metaTitle: brand.name,
      metaDescription:
        "Crisis triage for urgent eldercare in Haaglanden — recommended path, checklist, and local provider directory. Free for families.",
      heroSubline:
        "Short triage. Clear next path. Trackable checklist. Local providers. Free for families — no login to start.",
      registerInterest: "Register interest",
      preferEmail: "Prefer email? ",
      forFamilies: "For families",
      forCareProviders: "For care providers",
      familiesPrelaunch:
        "Register your interest. At launch we will help you navigate urgent care decisions.",
      familiesLive: "Start triage online. Get a path, a checklist, and access to the Haaglanden directory.",
      providersCard: "List for free. Pay only on placement. Receive introductions from triaged family cases.",
      viewTerms: "View terms",
      howItWorksLabel: "How it works",
      howItWorksTitle: "From urgency to next steps",
      howItWorksDesc:
        "Five clear steps — triage, path, checklist, directory, and official portals you complete yourself.",
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
      familiesLiveCard: "Start triage — free for families, no login required to begin.",
      listForFree: "List for free",
      providersLiveCard: "Pay only on successful placement. Read the terms.",
      providersSectionLabel: "Providers",
      providersSectionTitle: "For care providers",
      providersSectionDesc: "Reach families that truly fit — list for free, pay on placement.",
      registerYourLocation: "Register your location"
    },
    fundingEstimate: {
      metaTitle: `Care funding estimate | ${brand.name}`,
      metaDescription:
        "Rough monthly facility price estimate based on listed provider prices — not official CAK or Wmo guidance.",
      label: "Tools",
      title: "Care funding estimate",
      intro:
        "Compare your budget band with typical monthly prices listed by care providers on Shepherds Oud Care. Educational only — not a formal cost calculation.",
      careTypesLabel: "Care type(s)",
      fundingTypesLabel: "Funding path(s) already known",
      budgetLabel: "Monthly budget band",
      budgetPlaceholder: "Select a budget band",
      submit: "Show estimate",
      submitting: "Calculating…",
      needCareType: "Select at least one care type to see an estimate.",
      errorGeneric: "Something went wrong. Please try again.",
      resultTypicalTitle: "Typical facility monthly range",
      resultTypicalEmpty: "Insufficient data yet for this care type — listed providers have not published monthly prices.",
      resultTypicalBasedOn: (count: number) =>
        count === 1
          ? "Based on 1 listed provider with published monthly prices."
          : `Based on ${count} listed providers with published monthly prices.`,
      resultCoversTitle: "What usually covers what",
      covers: [
        {
          title: "Wlz",
          text: "Long-term Care Act — for people who need permanent intensive care (for example nursing home or 24-hour care at home). Indication is assessed by CIZ; formal contribution rules are set nationally."
        },
        {
          title: "Wmo",
          text: "Social Support Act — municipal support to stay at home longer (help at home, day activities, adaptations). Arranged via your municipality."
        },
        {
          title: "Zvw",
          text: "Health Insurance Act — covers many medical and nursing services through your basic health insurance, within policy rules."
        },
        {
          title: "PGB",
          text: "Personal budget — you receive budget to purchase care yourself instead of care in kind via a contracted provider."
        },
        {
          title: "Private funding",
          text: "Self-pay or private top-ups when public schemes do not cover the chosen arrangement, or while applications are in progress."
        }
      ],
      resultCompareTitle: "Your budget vs typical range",
      compareBelow: "Your stated budget band is below the typical listed range for this care type.",
      compareWithin: "Your stated budget band overlaps the typical listed range for this care type.",
      compareAbove: "Your stated budget band is above the typical listed range for this care type.",
      compareUnknown: "Select a budget band (and ensure price data exists) to compare with the typical range.",
      compareNoPrices: "We cannot compare your budget until providers have published prices for this care type.",
      disclaimer:
        "This is a rough estimate based on listed provider prices, not official CAK, Wmo, or insurance guidance. Start triage or contact us to discuss your situation.",
      primaryCta: "Start triage",
      secondaryCta: "Read funding FAQ",
      prefilledHint: "We prefilled fields from your latest intake. You can change them before estimating."
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
