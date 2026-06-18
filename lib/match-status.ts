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
  return ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "ACCEPTED"].includes(status);
}

export function matchStatusLabel(status: string) {
  switch (status) {
    case "CONTACTED":
      return "Visit or call coordinated";
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
  return familyMatchNextStep(status, providerName) || "This provider was matched to your request by a care advisor.";
}

export function familyMatchNextStep(status: string, providerName: string) {
  switch (status) {
    case "VISIT_REQUESTED":
      return `You asked to visit ${providerName}. The facility will accept or decline, then your care advisor helps schedule.`;
    case "CALLBACK_REQUESTED":
      return `You asked ${providerName} to call you back. The facility will respond, then your care advisor follows up.`;
    case "ACCEPTED":
      return `${providerName} accepted your request. Your care advisor will contact you to arrange the visit or call.`;
    case "CONTACTED":
      return `Your care advisor coordinated with ${providerName}. Expect contact soon about timing and next steps.`;
    case "PLACED":
      return `Placement is in progress with ${providerName}. Your care advisor will share final details.`;
    case "DECLINED":
      return `${providerName} is not available for this request right now. View other matches on your shortlist.`;
    case "CLOSED":
      return `This match with ${providerName} is closed.`;
    default:
      return "";
  }
}

export function isFamilyActionableMatchStatus(status?: string) {
  return Boolean(status && ["VISIT_REQUESTED", "CALLBACK_REQUESTED", "ACCEPTED", "CONTACTED", "PLACED"].includes(status));
}

export function adminInquiryActionMeta(status: MatchAdminAction) {
  switch (status) {
    case "CONTACTED":
      return {
        label: "Mark coordinated",
        description: "You arranged the visit or call with the family and provider."
      };
    case "PLACED":
      return {
        label: "Record placement",
        description: "The family chose this provider. Updates their match status."
      };
    case "CLOSED":
      return {
        label: "Close inquiry",
        description: "No further action needed on this match."
      };
    default:
      return { label: status, description: "" };
  }
}

type MatchAdminAction = "CONTACTED" | "PLACED" | "CLOSED";

export function providerInquiryStatusLabel(status: string) {
  switch (status) {
    case "SUGGESTED":
      return "New match";
    case "VISIT_REQUESTED":
      return "Visit requested";
    case "CALLBACK_REQUESTED":
      return "Callback requested";
    case "CONTACTED":
      return "Coordinating";
    case "ACCEPTED":
      return "Accepted by you";
    case "DECLINED":
      return "Declined by you";
    case "PLACED":
      return "Placement in progress";
    case "CLOSED":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
  }
}

export function providerInquiryBanner(status: string) {
  switch (status) {
    case "VISIT_REQUESTED":
      return "A family requested a visit to your facility. Accept if you can host them, or decline if you cannot help right now.";
    case "CALLBACK_REQUESTED":
      return "A family asked you to call them back. Accept if you can help, or decline if you are not available.";
    case "SUGGESTED":
      return "Your care advisor matched this family to your facility. They may request a visit or callback soon.";
    case "ACCEPTED":
      return "You accepted this inquiry. A care advisor will contact you to coordinate next steps.";
    case "CONTACTED":
      return "Your care advisor is coordinating the visit or call with this family.";
    case "PLACED":
      return "Placement is in progress for this family at your facility.";
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

export function providerInquiryActionMessage(status: string, familyName: string, priorStatus?: string) {
  switch (status) {
    case "ACCEPTED":
      if (priorStatus === "VISIT_REQUESTED") {
        return `You accepted the visit request from ${familyName}. A care advisor will help arrange timing with you.`;
      }
      if (priorStatus === "CALLBACK_REQUESTED") {
        return `You accepted the callback request from ${familyName}. A care advisor will follow up to coordinate.`;
      }
      return `You accepted the inquiry from ${familyName}. A care advisor will coordinate next steps with you.`;
    case "DECLINED":
      if (priorStatus === "VISIT_REQUESTED") {
        return `You declined the visit request from ${familyName}.`;
      }
      if (priorStatus === "CALLBACK_REQUESTED") {
        return `You declined the callback request from ${familyName}.`;
      }
      return `You declined the inquiry from ${familyName}.`;
    default:
      return "Inquiry updated.";
  }
}

export function adminInquiryHint(status: string) {
  switch (status) {
    case "SUGGESTED":
      return "Step 1 done — family can see this provider. Wait for them to request a visit or callback.";
    case "VISIT_REQUESTED":
      return "Step 2 — family requested a visit. Provider should accept or decline in their dashboard.";
    case "CALLBACK_REQUESTED":
      return "Step 2 — family requested a callback. Provider should accept or decline in their dashboard.";
    case "ACCEPTED":
      return "Step 3 — provider accepted. Call both sides, arrange timing, then click Mark coordinated.";
    case "CONTACTED":
      return "Step 4 — visit or call arranged. Record placement when the family commits, or close the inquiry.";
    case "DECLINED":
      return "Provider declined. Offer the family another match from the Families tab.";
    case "PLACED":
      return "Placement recorded. The family sees “Placement in progress” on their dashboard.";
    case "CLOSED":
      return "This inquiry is closed.";
    default:
      return "";
  }
}

export function providerMatchNotes(notes: string | null | undefined) {
  if (!notes) return null;

  return notes
    .split("\n")
    .map((line) => {
      if (line.startsWith("Provider accepted")) {
        return line.replace("Provider accepted", "You accepted");
      }
      if (line.startsWith("Provider declined")) {
        return line.replace("Provider declined", "You declined");
      }
      if (line.startsWith("Family requested a visit")) {
        return line.replace("Family requested a visit", "Visit requested");
      }
      if (line.startsWith("Family requested a callback")) {
        return line.replace("Family requested a callback", "Callback requested");
      }
      if (line.startsWith("Care advisor marked coordinated")) {
        return line.replace("Care advisor marked coordinated", "Care advisor coordinated");
      }
      return line;
    })
    .join("\n");
}

export function familyRequestNote(status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return status === "VISIT_REQUESTED"
    ? `Family requested a visit on ${when}.`
    : `Family requested a callback on ${when}.`;
}
