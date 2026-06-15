import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { waitlistSchema } from "@/lib/validation/waitlist";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    await notifyWaitlist(parsed.data.contactName, parsed.data.email, parsed.data.type);
    return NextResponse.json({ id: "demo-waitlist", mode: "demo" }, { status: 201 });
  }

  const { prisma } = await import("@/lib/db");
  const entry = await prisma.waitlistEntry.create({ data: parsed.data });
  await notifyWaitlist(parsed.data.contactName, parsed.data.email, parsed.data.type);

  return NextResponse.json({ id: entry.id, mode: "database" }, { status: 201 });
}

async function notifyWaitlist(name: string, email: string, type: "FAMILY" | "FACILITY") {
  const advisorEmail = process.env.ADVISOR_EMAIL;
  const label = type === "FAMILY" ? "family" : "facility";

  await Promise.all([
    sendBrevoEmail({
      to: [{ email, name }],
      subject: "Thanks for joining the Shepherds Oud waitlist",
      htmlContent: `<p>Hello ${name},</p><p>Thank you for registering your ${label} interest with Shepherds Oud. We will contact you as soon as the platform is ready.</p>`,
      textContent: `Hello ${name}, thank you for registering your ${label} interest with Shepherds Oud.`
    }),
    advisorEmail
      ? sendBrevoEmail({
          to: [{ email: advisorEmail, name: "Shepherds Oud advisor" }],
          subject: `New ${label} waitlist registration: ${name}`,
          htmlContent: `<p>A new ${label} waitlist registration was submitted by ${name} (${email}).</p>`,
          textContent: `A new ${label} waitlist registration was submitted by ${name} (${email}).`
        })
      : Promise.resolve({ mode: "demo" as const, skipped: true })
  ]);
}
