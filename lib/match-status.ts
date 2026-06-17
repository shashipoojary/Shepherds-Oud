const familyVisibleStatuses = new Set([
  "SUGGESTED",
  "CONTACTED",
  "VISIT_REQUESTED",
  "CALLBACK_REQUESTED",
  "ACCEPTED",
  "PLACED"
]);

const matchPriority: Record<string, number> = {
  VISIT_REQUESTED: 0,
  CALLBACK_REQUESTED: 1,
  ACCEPTED: 2,
  SUGGESTED: 3,
  CONTACTED: 4,
  PLACED: 5,
  DECLINED: 6,
  CLOSED: 7
};

export function isFamilyVisibleMatchStatus(status: string) {
  return familyVisibleStatuses.has(status);
}

export function compareMatchPriority(a: string, b: string) {
  return (matchPriority[a] ?? 99) - (matchPriority[b] ?? 99);
}

export function isProviderActionNeeded(status: string) {
  return ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "SUGGESTED"].includes(status);
}

export function isAdminActionNeeded(status: string) {
  return ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "ACCEPTED", "CONTACTED"].includes(status);
}

export function matchStatusLabel(status: string) {
  switch (status) {
    case "CONTACTED":
      return "Provider contacted you";
    case "VISIT_REQUESTED":
      return "Visit requested";
    case "CALLBACK_REQUESTED":
      return "Callback requested";
    case "ACCEPTED":
      return "Provider accepted";
    case "DECLINED":
      return "Provider declined";
    case "PLACED":
      return "Placement in progress";
    case "CLOSED":
      return "Closed";
    default:
      return "Suggested match";
  }
}

export function adminMatchStatusLabel(status: string) {
  switch (status) {
    case "SUGGESTED":
      return "Suggested";
    case "VISIT_REQUESTED":
      return "Visit requested";
    case "CALLBACK_REQUESTED":
      return "Callback requested";
    case "CONTACTED":
      return "Coordinated";
    case "ACCEPTED":
      return "Provider accepted";
    case "DECLINED":
      return "Provider declined";
    case "PLACED":
      return "Placed";
    case "CLOSED":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
  }
}

export function matchStatusBadgeClass(status: string) {
  switch (status) {
    case "VISIT_REQUESTED":
      return "bg-brand-amber/15 text-brand-amber-dark ring-1 ring-brand-amber/30";
    case "CALLBACK_REQUESTED":
      return "bg-brand-green-pale/40 text-brand-green-dark ring-1 ring-brand-green-light/40";
    case "ACCEPTED":
    case "PLACED":
      return "bg-brand-green-pale/60 text-brand-green-dark";
    case "DECLINED":
    case "CLOSED":
      return "bg-stone-200 text-neutral-600";
    case "CONTACTED":
      return "bg-brand-cream text-ink/70 ring-1 ring-stone-200";
    default:
      return "bg-brand-service-pale text-brand-green-dark";
  }
}

export function matchStatusHint(status: string, providerName: string) {
  switch (status) {
    case "CONTACTED":
      return `${providerName} has been in touch. A care advisor can help with next steps.`;
    case "VISIT_REQUESTED":
      return "Your visit request was sent. The facility and care advisor will coordinate next steps.";
    case "CALLBACK_REQUESTED":
      return "Your callback request was sent. Expect follow-up from the facility or our team.";
    case "ACCEPTED":
      return `${providerName} accepted your inquiry. A care advisor will help arrange the next step.`;
    case "DECLINED":
      return `${providerName} is not available for this request right now.`;
    case "PLACED":
      return "Your family is moving toward placement with this provider.";
    default:
      return "This provider was matched to your request by a care advisor.";
  }
}

export function providerInquiryStatusLabel(status: string) {
  return adminMatchStatusLabel(status);
}

export function providerInquiryBanner(status: string) {
  switch (status) {
    case "VISIT_REQUESTED":
      return "Family requested a visit — please accept or decline so they know you are interested.";
    case "CALLBACK_REQUESTED":
      return "Family requested a callback — please accept or decline so they know you can help.";
    case "SUGGESTED":
      return "New match from your care advisor. The family can see your facility on their shortlist.";
    case "ACCEPTED":
      return "You accepted this family. The care advisor may contact you to coordinate next steps.";
    case "CONTACTED":
      return "Marked as contacted. The care advisor is helping coordinate.";
    default:
      return null;
  }
}

export function providerAcceptButtonLabel(status: string) {
  switch (status) {
    case "VISIT_REQUESTED":
      return "Accept visit request";
    case "CALLBACK_REQUESTED":
      return "Accept callback request";
    default:
      return "Accept inquiry";
  }
}

export function providerInquiryActionMessage(status: string, familyName: string) {
  switch (status) {
    case "CONTACTED":
      return `Marked ${familyName} as contacted.`;
    case "ACCEPTED":
      return `Accepted ${familyName}. They will see this on their matches page and a care advisor can coordinate next steps.`;
    case "DECLINED":
      return `Declined ${familyName}. The family will no longer see this match.`;
    default:
      return "Inquiry updated.";
  }
}

export function adminInquiryHint(status: string) {
  switch (status) {
    case "SUGGESTED":
      return "Match published to the family. Waiting for them to request a visit or callback.";
    case "VISIT_REQUESTED":
      return "Family asked for a visit. Provider should accept or decline. You can follow up with both sides.";
    case "CALLBACK_REQUESTED":
      return "Family asked for a callback. Provider should accept or decline. You can follow up with both sides.";
    case "ACCEPTED":
      return "Provider accepted. Coordinate the visit or call, then mark as placed when done.";
    case "CONTACTED":
      return "You marked this as coordinated. Close the loop with placement or close the inquiry.";
    case "DECLINED":
      return "Provider declined. Consider offering the family another match.";
    case "PLACED":
      return "Placement recorded for this match.";
    case "CLOSED":
      return "This inquiry is closed.";
    default:
      return "";
  }
}

export function familyRequestNote(status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return status === "VISIT_REQUESTED"
    ? `Family requested a visit on ${when}.`
    : `Family requested a callback on ${when}.`;
}
