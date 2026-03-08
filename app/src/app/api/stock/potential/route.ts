import { NextResponse } from "next/server";
import { calculateAllPotentials } from "@/services/potential.service";
import { handleRouteError } from "@/lib/api/handle-route-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") ?? undefined;
    const items = await calculateAllPotentials(itemId);
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}
