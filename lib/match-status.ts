const familyVisibleStatuses = new Set([
  "SUGGESTED",
  "CONTACTED",
  "VISIT_REQUESTED",
  "CALLBACK_REQUESTED",
  "ACCEPTED",
  "PLACED"
]);

export function isFamilyVisibleMatchStatus(status: string) {
  return familyVisibleStatuses.has(status);
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

export function matchStatusHint(status: string, providerName: string) {
  switch (status) {
    case "CONTACTED":
      return `${providerName} has been in touch. A care advisor can help with next steps.`;
    case "VISIT_REQUESTED":
      return "Your visit request was sent. A care advisor will coordinate with the facility.";
    case "CALLBACK_REQUESTED":
      return "Your callback request was sent. Expect follow-up from our team.";
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
  switch (status) {
    case "SUGGESTED":
      return "New match";
    case "VISIT_REQUESTED":
      return "Visit requested";
    case "CALLBACK_REQUESTED":
      return "Callback requested";
    case "CONTACTED":
      return "Contacted";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "PLACED":
      return "Placed";
    case "CLOSED":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
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
