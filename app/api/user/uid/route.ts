import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { AddUIDRequest } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(
            await cookies(),
            sessionOptions
        );

        if (!session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const db = await getDatabase();
        // Get Discord User to get discord_id
        const user = await db.collection(COLLECTIONS.DISCORD_USERS).findOne({ _id: new (require("mongodb").ObjectId)(session.user.id) });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Now query Subscriptions with discord_id
        const subscription = await db.collection(COLLECTIONS.SUBSCRIPTIONS).findOne({ discord_id: user.discord_id });

        if (!subscription) {
            return NextResponse.json({
                success: true,
                data: null
            });
        }

        // Check expiry logic if needed, but we return whatever is there
        return NextResponse.json({
            success: true,
            data: {
                uid: subscription.uid,
                expiry_date: subscription.expiry_date,
                created_at: subscription.created_at,
                status: new Date(subscription.expiry_date) > new Date() ? 'active' : 'inactive'
            }
        });

    } catch (error) {
        console.error("Get UID Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
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

        if (!session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { uid } = await request.json() as AddUIDRequest;

        if (!uid) {
            return NextResponse.json(
                { success: false, message: "UID is required" },
                { status: 400 }
            );
        }

        const db = await getDatabase();

        const user = await db.collection(COLLECTIONS.DISCORD_USERS).findOne({ _id: new (require("mongodb").ObjectId)(session.user.id) });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // CHECK 1: User already has a subscription/UID?
        const existingOwnUid = await db.collection(COLLECTIONS.SUBSCRIPTIONS).findOne({ discord_id: user.discord_id });
        if (existingOwnUid) {
            return NextResponse.json(
                { success: false, message: "You can only have one UID." },
                { status: 400 }
            );
        }

        // CHECK 2: UID already claimed by someone else?
        const existingUid = await db.collection(COLLECTIONS.SUBSCRIPTIONS).findOne({ uid: uid });
        if (existingUid) {
            return NextResponse.json(
                { success: false, message: "This UID is already in use." },
                { status: 400 }
            );
        }

        // Insert into SUBSCRIPTIONS
        // We follow the existing schema structure
        const now = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days
        // String format YYYY-MM-DD for expiry_date based on existing interface but let's check if it accepts ISO string.
        // types/subscription.ts says: expiry_date: string; // YYYY-MM-DD format
        // But in my previous code I used Date object.
        // Let's format it to YYYY-MM-DD to be safe with existing admin panel which might rely on string format.
        const expiryString = expiryDate.toISOString().split('T')[0];

        await db.collection(COLLECTIONS.SUBSCRIPTIONS).insertOne({
            uid: uid,
            discord_id: user.discord_id, // Link to user
            expiry_date: expiryString,
            status: 'active',
            created_at: now,
            updated_at: now
        });

        return NextResponse.json({
            success: true,
            message: "UID added successfully",
            data: {
                uid: uid,
                expiry_date: expiryDate, // Return Date object for frontend formatting
                status: 'active'
            }
        });

    } catch (error) {
        console.error("Add UID Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(
            await cookies(),
            sessionOptions
        );

        if (!session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const db = await getDatabase();
        const user = await db.collection(COLLECTIONS.DISCORD_USERS).findOne({ _id: new (require("mongodb").ObjectId)(session.user.id) });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Delete from SUBSCRIPTIONS
        await db.collection(COLLECTIONS.SUBSCRIPTIONS).deleteOne({ discord_id: user.discord_id });

        return NextResponse.json({
            success: true,
            message: "UID deleted successfully"
        });

    } catch (error) {
        console.error("Delete UID Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(
            await cookies(),
            sessionOptions
        );

        if (!session.user || !session.user.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { expiry_date } = await request.json();
        if (!expiry_date) {
            return NextResponse.json({ success: false, message: "Expiry date required" }, { status: 400 });
        }

        const db = await getDatabase();
        const user = await db.collection(COLLECTIONS.DISCORD_USERS).findOne({ _id: new (require("mongodb").ObjectId)(session.user.id) });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Update in SUBSCRIPTIONS
        await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
            { discord_id: user.discord_id },
            {
                $set: {
                    expiry_date: expiry_date, // Assuming frontend sends YYYY-MM-DD
                    updated_at: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: "UID expiry updated successfully"
        });

    } catch (error) {
        console.error("Update UID Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
