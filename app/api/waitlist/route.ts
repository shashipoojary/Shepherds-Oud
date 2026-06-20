import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email/brevo";
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
        notifyWaitlist(parsed.data.contactName, parsed.data.email, parsed.data.type),
        "waitlist_confirmation_email"
      );
      return jsonOk({ id: "demo-waitlist", mode: "demo" }, 201);
    }

    const { prisma } = await import("@/lib/core/db");
    const entry = await prisma.waitlistEntry.create({ data: parsed.data });

    void runInBackground(
      notifyWaitlist(parsed.data.contactName, parsed.data.email, parsed.data.type),
      "waitlist_confirmation_email"
    );

    return jsonOk({ id: entry.id, mode: "database" }, 201);
  } catch (error) {
    return handleApiError(error, "waitlist_create");
  }
}

async function notifyWaitlist(name: string, email: string, type: "FAMILY" | "FACILITY") {
  const advisorEmail = process.env.ADVISOR_EMAIL;
  const label = type === "FAMILY" ? "family" : "facility";

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "Thanks for joining the Shepherds Oud waitlist",
      htmlContent: `<p>Hello ${name},</p><p>Thank you for registering your ${label} interest with Shepherds Oud. We will contact you as soon as the platform is ready.</p>`,
      textContent: `Hello ${name}, thank you for registering your ${label} interest with Shepherds Oud.`
    }),
    advisorEmail
      ? sendBrevoEmail({
          to: [{ email: advisorEmail, name: "Shepherds Oud Care Guide team" }],
          subject: `New ${label} waitlist registration: ${name}`,
          htmlContent: `<p>A new ${label} waitlist registration was submitted by ${name} (${email}).</p>`,
          textContent: `A new ${label} waitlist registration was submitted by ${name} (${email}).`
        })
      : Promise.resolve({ mode: "demo" as const, skipped: true })
  ]);
}
