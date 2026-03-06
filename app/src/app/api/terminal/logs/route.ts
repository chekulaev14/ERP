import { NextResponse } from "next/server";
import { getProductionLogs } from "@/services/terminal-logs.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const workerId = searchParams.get("workerId") || undefined;

  const result = await getProductionLogs({ days, workerId });
  return NextResponse.json(result);
}
