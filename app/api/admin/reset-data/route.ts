import { NextResponse } from "next/server";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { resetOperationalData } from "@/lib/data/reset-demo-data";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        deleted: { matches: 0, actionLogs: 0, intakes: 0, waitlist: 0, providers: 0 }
      });
    }

    const deleted = await resetOperationalData();

    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
