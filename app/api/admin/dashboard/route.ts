import { NextResponse } from "next/server";
import { getAdminDashboardData } from "@/lib/data/admin";
import { getServerSession, getUserRole } from "@/lib/auth-server";

export async function GET() {
  const session = await getServerSession();
  if (!session || getUserRole(session) !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getAdminDashboardData();
  return NextResponse.json(data);
}
