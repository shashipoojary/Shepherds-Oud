import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/auth/cron";
import { runRetentionPolicies } from "@/lib/data/retention-policies";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRetentionPolicies();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error("Retention cron failed", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Retention policy failed"
      },
      { status: 500 }
    );
  }
}
