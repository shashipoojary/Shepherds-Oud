import { handleApiError, jsonOk, rateLimitResponse } from "@/lib/core/api-helpers";
import { listDirectoryProviders } from "@/lib/data/directory";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "v2-directory-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const providers = await listDirectoryProviders({
      type: searchParams.get("type") || undefined,
      municipality: searchParams.get("municipality") || undefined,
      language: searchParams.get("language") || undefined,
      funding: searchParams.get("funding") || undefined
    });

    return jsonOk({ providers });
  } catch (error) {
    return handleApiError(error, "v2_directory_list");
  }
}
