import { getServerSession } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "v2-push-subscribe", 20, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = (await readJsonBody(request, 8_000)) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      enabled?: boolean;
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return jsonError("Invalid push subscription.", 400);
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        enabled: body.enabled !== false
      },
      update: {
        userId: session.user.id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        enabled: body.enabled !== false
      }
    });

    return jsonOk({ id: subscription.id, enabled: subscription.enabled });
  } catch (error) {
    return handleApiError(error, "v2_push_subscribe");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = (await readJsonBody(request, 4_000)) as { endpoint?: string };
    if (!body.endpoint) return jsonError("endpoint is required.", 400);

    await prisma.pushSubscription.updateMany({
      where: { userId: session.user.id, endpoint: body.endpoint },
      data: { enabled: false }
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error, "v2_push_unsubscribe");
  }
}
