import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { GetActivityLogsResponse } from "@/types/api";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.ACTIVITY_LOGS);

    const logs = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      logs,
    } as GetActivityLogsResponse);
  } catch (error) {
    console.error("Get activity logs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "Failed to fetch activity logs",
        },
      },
      { status: 500 }
    );
  }
}
