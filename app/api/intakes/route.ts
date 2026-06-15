import { NextResponse } from "next/server";
import { intakeSchema } from "@/lib/validation/intake";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = intakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid intake", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ id: "demo-intake", status: "received", mode: "demo" }, { status: 201 });
  }

  const intake = await prisma.intake.create({
    data: parsed.data
  });

  return NextResponse.json({ id: intake.id, status: intake.status, mode: "database" }, { status: 201 });
}
