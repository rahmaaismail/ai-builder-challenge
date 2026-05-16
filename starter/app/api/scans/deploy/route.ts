import { NextRequest, NextResponse } from "next/server";
import { createApiClient, ApiError } from "@/lib/api-client";
import type { DeployScanInput } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: DeployScanInput;
  try {
    body = (await req.json()) as DeployScanInput;
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body is not valid JSON." } },
      { status: 400 },
    );
  }

  const api = createApiClient();

  let asset;
  try {
    asset = await api.scans.deploy(body);
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

  const { location } = asset;
  const rack_location = [location.site, location.room, location.row, location.rack, location.ru]
    .filter(Boolean)
    .join("/");

  const writebacks = await Promise.allSettled([
    api.mock.updateFacilities({ tagged_id: asset.asset_tag, rack_location }),
    api.mock.updateFinance({
      tag: asset.asset_tag,
      site: location.site,
      status: "capitalized",
      capitalized_on: new Date().toISOString().split("T")[0]!,
    }),
  ]);

  writebacks.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[deploy write-back ${i}] failed for ${asset.asset_tag}:`, r.reason);
    }
  });

  return NextResponse.json(asset);
}