import { NextResponse } from "next/server";
import { runClickUpStatusSync } from "@/lib/internal/sync";

export async function POST(request: Request) {
  const syncSecret = process.env.INTERNAL_SYNC_SECRET;
  const requestSecret = request.headers.get("x-internal-sync-secret");

  if (!syncSecret || requestSecret !== syncSecret) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runClickUpStatusSync();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Status sync failed.",
      },
      { status: 500 }
    );
  }
}
