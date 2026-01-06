import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { GetSubscriptionsResponse } from "@/types/api";
import { createSubscriptionSchema } from "@/lib/validation";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (search) {
      query.uid = { $regex: search, $options: "i" };
    }

    if (status !== "all") {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.expiry_date = {};
      if (dateFrom) {
        query.expiry_date.$gte = dateFrom;
      }
      if (dateTo) {
        query.expiry_date.$lte = dateTo;
      }
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * limit;
    const subscriptions = await collection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      subscriptions,
      total,
      page,
      totalPages,
    } as GetSubscriptionsResponse);

    // Disable caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "Failed to fetch subscriptions",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const body = await request.json();

    // Validate input
    const validation = createSubscriptionSchema.safeParse(body);
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

    const { uid, expiry_date, status } = validation.data;

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.SUBSCRIPTIONS);

    // Check for duplicate UID
    const existing = await collection.findOne({ uid });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_UID",
            message: "A subscription with this UID already exists",
          },
        },
        { status: 400 }
      );
    }

    // Insert new subscription
    const now = new Date();
    const result = await collection.insertOne({
      uid,
      expiry_date,
      status,
      created_at: now,
      updated_at: now,
    });

    // Log activity
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).insertOne({
      timestamp: now,
      admin_user: session.user?.username || "unknown",
      action: "create",
      target_uid: uid,
      ip_address: ip,
    });

    const subscription = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATE_ERROR",
          message: "Failed to create subscription",
        },
      },
      { status: 500 }
    );
  }
}
