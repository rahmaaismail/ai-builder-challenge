import { NextResponse } from "next/server";
import { runReconciliation } from "@/lib/reconcile";

export async function GET(): Promise<NextResponse> {
  try {
    const report = await runReconciliation();
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "reconcile_failed", message } },
      { status: 502 },
    );
  }
}