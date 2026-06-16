import { NextResponse } from "next/server";
import { getServerSession, getUserRole } from "@/lib/auth-server";
import { getProviderInquiries, getUserLinkedProvider, upsertProviderForUser } from "@/lib/provider-server";
import { providerProfileSchema } from "@/lib/validation/provider";

async function assertProviderAccess() {
  const session = await getServerSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const role = getUserRole(session);
  if (role !== "PROVIDER") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;
    const provider = await getUserLinkedProvider(auth.session.user.id);
    const inquiries = provider ? await getProviderInquiries(provider.id) : [];

    return NextResponse.json({
      provider,
      inquiries: inquiries.map((match) => ({
        id: match.id,
        score: match.score,
        status: match.status,
        notes: match.notes,
        createdAt: match.createdAt.toISOString(),
        intake: match.intake
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load provider profile.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;
    const body = await request.json();
    const parsed = providerProfileSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstFieldError = Object.values(fieldErrors).flat()[0];
      return NextResponse.json(
        { error: firstFieldError || "Invalid profile data.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const provider = await upsertProviderForUser(auth.session.user.id, auth.session.user.email, parsed.data);

    return NextResponse.json(provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save provider profile.";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
