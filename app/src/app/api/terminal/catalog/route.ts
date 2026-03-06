import { NextResponse } from "next/server";
import { getCatalog } from "@/services/catalog.service";

export async function GET() {
  const categories = await getCatalog();
  return NextResponse.json(categories);
}
