import { Prisma } from "@prisma/client";

const INTERNAL_PATTERNS = [/prisma/i, /invalid `\w+\.\w+\(\)`/i, /invocation:/i, /constraint violation/i, /P\d{4}/];

function looksInternal(message: string) {
  return INTERNAL_PATTERNS.some((pattern) => pattern.test(message));
}

export function providerSaveErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2011") {
      const target = String(error.meta?.constraint ?? error.meta?.target ?? "").toLowerCase();
      if (target.includes("bedsopen") || target.includes("beds_open")) {
        return "Please enter available beds. Use 0 if none are open right now.";
      }
      if (target.includes("bedstotal") || target.includes("beds_total")) {
        return "Please enter total beds or places. Use 0 if not applicable.";
      }
      return "A required field is missing. Please review your facility profile and try again.";
    }

    if (error.code === "P2002") {
      return "This facility profile could not be saved because of a duplicate record.";
    }

    return "Could not save your facility profile. Please check your entries and try again.";
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return "Could not save your facility profile. Please check your entries and try again.";
  }

  if (error instanceof Error) {
    if (error.message === "User not found.") {
      return "Your account could not be found. Please sign in again.";
    }

    if (looksInternal(error.message)) {
      return "Could not save your facility profile. Please check your entries and try again.";
    }

    return error.message;
  }

  return "Could not save your facility profile. Please try again.";
}

export function sanitizeClientErrorMessage(message: string) {
  if (!message.trim()) {
    return "Something went wrong. Please try again.";
  }

  if (looksInternal(message)) {
    return "Could not complete your request. Please check your entries and try again.";
  }

  return message;
}
