import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { bulkUpdateSchema } from "@/lib/validation";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { BulkUpdateResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const body = await request.json();

    // Validate input
    const validation = bulkUpdateSchema.safeParse(body);
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

    const { ids, updates } = validation.data;

    // Validate all IDs
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid IDs provided",
          updatedCount: 0,
        } as BulkUpdateResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Get UIDs before update for activity log
    const subscriptions = await collection
      .find({ _id: { $in: objectIds } })
      .toArray();
    const uids = subscriptions.map((sub) => sub.uid);

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    // Handle extend_days
    if (updates.extend_days) {
      // For each subscription, we need to update individually to add days
      let updatedCount = 0;

      for (const sub of subscriptions) {
        const currentDate = new Date(sub.expiry_date);
        const newDate = new Date(
          currentDate.getTime() + updates.extend_days * 24 * 60 * 60 * 1000
        );
        const newDateStr = newDate.toISOString().split("T")[0];

        await collection.updateOne(
          { _id: sub._id },
          {
            $set: {
              expiry_date: newDateStr,
              updated_at: new Date(),
            },
          }
        );
        updatedCount++;
      }

      // Log activity
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
        timestamp: new Date(),
        admin_user: session.user?.username || "unknown",
        action: "bulk_update",
        target_uid: uids,
        changes: [
          {
            field: "expiry_date",
            old_value: "various",
            new_value: `extended by ${updates.extend_days} days`,
          },
        ],
        ip_address: ip,
      });

      return NextResponse.json({
        success: true,
        updatedCount,
        message: `Successfully updated ${updatedCount} subscription(s)`,
      } as BulkUpdateResponse);
    }

    // Update subscriptions (for status changes)
    const result = await collection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changes: any[] = [];
    if (updates.status) {
      changes.push({
        field: "status",
        old_value: "various",
        new_value: updates.status,
      });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
      timestamp: new Date(),
      admin_user: session.user?.username || "unknown",
      action: "bulk_update",
      target_uid: uids,
      changes,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Successfully updated ${result.modifiedCount} subscription(s)`,
    } as BulkUpdateResponse);
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      {
        success: false,
        updatedCount: 0,
        message: "Failed to update subscriptions",
      } as BulkUpdateResponse,
      { status: 500 }
    );
  }
}
