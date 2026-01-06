import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, getUserProfile, getAvatarUrl } from "@/lib/discord";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
        return NextResponse.redirect(new URL("/login?error=discord_auth_failed", getBaseUrl(request.url)));
    }

    try {
        const accessToken = await getAccessToken(code);
        const discordUser = await getUserProfile(accessToken);

        // Database Logic
        const db = await getDatabase();
        const usersCollection = db.collection(COLLECTIONS.DISCORD_USERS);

        // Upsert User
        const updateResult = await usersCollection.updateOne(
            { discord_id: discordUser.id },
            {
                $set: {
                    username: discordUser.username,
                    avatar: getAvatarUrl(discordUser),
                    last_login: new Date()
                },
                $setOnInsert: {
                    created_at: new Date()
                }
            },
            { upsert: true }
        );

        let userId = updateResult.upsertedId?.toString();
        if (!userId) {
            // If not upserted (updated), we need to find the user to get _id
            const user = await usersCollection.findOne({ discord_id: discordUser.id });
            userId = user?._id.toString();
        }

        // Session Logic
        const session = await getIronSession<SessionData>(
            await cookies(),
            sessionOptions
        );

        session.user = {
            id: userId!,
            username: discordUser.username,
            isLoggedIn: true,
            role: 'user',
            avatar: getAvatarUrl(discordUser)
        };

        console.log("Saving session for user:", session.user);
        await session.save();
        console.log("Session saved. Redirecting to /user");

        return NextResponse.redirect(new URL("/user", getBaseUrl(request.url)));

    } catch (err) {
        console.error("Discord Callback Error:", err);
        return NextResponse.redirect(new URL("/login?error=internal_error", getBaseUrl(request.url)));
    }
}
