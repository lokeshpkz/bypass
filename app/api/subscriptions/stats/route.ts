import { NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { GetStatsResponse } from "@/types/api";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Get all counts in parallel
    const [total, active, inactive, expired, expiring_soon] =
      await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ status: "active" }),
        collection.countDocuments({ status: "inactive" }),
        collection.countDocuments({ expiry_date: { $lt: today } }),
        collection.countDocuments({
          expiry_date: { $gte: today, $lte: sevenDaysFromNow },
        }),
      ]);

    const response = NextResponse.json({
      total,
      active,
      inactive,
      expired,
      expiring_soon,
    } as GetStatsResponse);

    // Disable caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "STATS_ERROR",
          message: "Failed to fetch statistics",
        },
      },
      { status: 500 }
    );
  }
}
