import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { updateSubscriptionSchema } from "@/lib/validation";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid subscription ID",
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = updateSubscriptionSchema.safeParse(body);
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

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Get existing subscription
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Subscription not found",
          },
        },
        { status: 404 }
      );
    }

    // Track changes for activity log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changes: any[] = [];
    if (
      validation.data.expiry_date &&
      validation.data.expiry_date !== existing.expiry_date
    ) {
      changes.push({
        field: "expiry_date",
        old_value: existing.expiry_date,
        new_value: validation.data.expiry_date,
      });
    }
    if (validation.data.status && validation.data.status !== existing.status) {
      changes.push({
        field: "status",
        old_value: existing.status,
        new_value: validation.data.status,
      });
    }

    // Update subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...validation.data,
      updated_at: new Date(),
    };

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Log activity
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
      timestamp: new Date(),
      admin_user: session.user?.username || "unknown",
      action: "update",
      target_uid: existing.uid,
      changes,
      ip_address: ip,
    });

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: "Failed to update subscription",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid subscription ID",
          },
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Get existing subscription
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Subscription not found",
          },
        },
        { status: 404 }
      );
    }

    // Delete subscription
    await collection.deleteOne({ _id: new ObjectId(id) });

    // Log activity
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
      timestamp: new Date(),
      admin_user: session.user?.username || "unknown",
      action: "delete",
      target_uid: existing.uid,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Delete subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DELETE_ERROR",
          message: "Failed to delete subscription",
        },
      },
      { status: 500 }
    );
  }
}
