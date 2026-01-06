import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { bulkDeleteSchema } from "@/lib/validation";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { BulkDeleteResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const body = await request.json();

    // Validate input
    const validation = bulkDeleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { ids } = validation.data;

    // Validate all IDs
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid IDs provided",
          deletedCount: 0,
        } as BulkDeleteResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Get UIDs before deletion for activity log
    const subscriptions = await collection
      .find({ _id: { $in: objectIds } })
      .toArray();
    const uids = subscriptions.map((sub) => sub.uid);

    // Delete subscriptions
    const result = await collection.deleteMany({ _id: { $in: objectIds } });

    // Log activity
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
      timestamp: new Date(),
      admin_user: session.user?.username || "unknown",
      action: "bulk_delete",
      target_uid: uids,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} subscription(s)`,
    } as BulkDeleteResponse);
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      {
        success: false,
        deletedCount: 0,
        message: "Failed to delete subscriptions",
      } as BulkDeleteResponse,
      { status: 500 }
    );
  }
}
