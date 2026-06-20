import { NextResponse } from "next/server";
import { logError } from "@/lib/core/logger";
import { checkRateLimit, getClientIp } from "@/lib/core/rate-limit";

const DEFAULT_MAX_BODY_BYTES = 64_000;

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function rateLimitResponse(request: Request, scope: string, limit: number, windowMs: number) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${scope}:${ip}`, limit, windowMs);

  if (result.ok) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds)
      }
    }
  );
}

export async function readJsonBody(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (Number.isFinite(length) && length > maxBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  if (!raw.trim()) {
    throw new Error("EMPTY_BODY");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function handleApiError(error: unknown, context: string) {
  if (error instanceof Error) {
    if (error.message === "PAYLOAD_TOO_LARGE") {
      return jsonError("Request body is too large.", 413);
    }

    if (error.message === "EMPTY_BODY") {
      return jsonError("Request body is required.", 400);
    }

    if (error.message === "INVALID_JSON") {
      return jsonError("Invalid JSON body.", 400);
    }

    logError(context, { message: error.message });
    return jsonError("Something went wrong. Please try again.", 500);
  }

  logError(context, { message: "Unknown error" });
  return jsonError("Something went wrong. Please try again.", 500);
}

export async function runInBackground(task: Promise<unknown>, context: string) {
  try {
    await task;
  } catch (error) {
    logError(context, {
      message: error instanceof Error ? error.message : "Background task failed"
    });
  }
}
