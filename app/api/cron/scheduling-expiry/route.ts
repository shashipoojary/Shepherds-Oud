import { NextResponse } from "next/server";
import { expireStaleMatchSchedules } from "@/lib/scheduling/match-schedule";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStaleMatchSchedules(100);
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error("Scheduling expiry cron failed", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Scheduling expiry failed"
      },
      { status: 500 }
    );
  }
}
