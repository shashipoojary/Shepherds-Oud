import { NextResponse } from "next/server";
import { sendWaitlistConfirmationEmails } from "@/lib/email/waitlist-confirmation-email";
import { waitlistSchema } from "@/lib/validation/waitlist";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody, runInBackground } from "@/lib/core/api-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "waitlist-create", 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await readJsonBody(request);
    const parsed = waitlistSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid registration", 400, { issues: parsed.error.flatten() });
    }

    if (!process.env.DATABASE_URL) {
      void runInBackground(
        sendWaitlistConfirmationEmails({
          contactName: parsed.data.contactName,
          email: parsed.data.email,
          type: parsed.data.type
        }),
        "waitlist_confirmation_email"
      );
      return jsonOk({ id: "demo-waitlist", mode: "demo" }, 201);
    }

    const { prisma } = await import("@/lib/core/db");
    const entry = await prisma.waitlistEntry.create({ data: parsed.data });

    void runInBackground(
      sendWaitlistConfirmationEmails({
        contactName: parsed.data.contactName,
        email: parsed.data.email,
        type: parsed.data.type
      }),
      "waitlist_confirmation_email"
    );

    return jsonOk({ id: entry.id, mode: "database" }, 201);
  } catch (error) {
    return handleApiError(error, "waitlist_create");
  }
}
