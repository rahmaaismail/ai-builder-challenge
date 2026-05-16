import { NextRequest, NextResponse } from "next/server";
import { createApiClient, ApiError } from "@/lib/api-client";
import type { StoreScanInput } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: StoreScanInput;
  try {
    body = (await req.json()) as StoreScanInput;
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Invalid JSON." } },
      { status: 400 },
    );
  }

  const api = createApiClient();

  let wasInService = false;
  try {
    const current = await api.assets.get(body.asset_tag);
    wasInService = current.state === "in_service";
  } catch { /* 404 → store will 404 too */ }

  let asset;
  try {
    asset = await api.scans.store(body);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: "upstream_error", message: "The API did not respond." } },
      { status: 502 },
    );
  }

  if (wasInService) {
    await api.mock
      .updateFacilities({ tagged_id: asset.asset_tag, rack_location: null })
      .catch((e) =>
        console.error(`[store write-back] de-rack failed for ${asset.asset_tag}:`, e),
      );
  }

  return NextResponse.json(asset);
}