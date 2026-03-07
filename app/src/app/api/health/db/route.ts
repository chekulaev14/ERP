import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "db",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health/db] error:", error);
    return NextResponse.json(
      {
        ok: false,
        service: "db",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
