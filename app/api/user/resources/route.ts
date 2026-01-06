import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

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

        // Static data for now as Admin Dashboard integration for uploads is out of scope/unchanged.
        const resources = {
            downloadUrl: "https://mega.nz/file/ALcjXI6a#3a7clpnyvukxViiJ57YDCJbhdXE5oTBiP-eI9z8jKek", // Replace with real URL or logic
            tutorials: [
                {
                    id: "1",
                    title: "How to use the UID Bypass",
                    url: "https://youtube.com/hybridkodrr",
                    type: "youtube"
                },
                {
                    id: "2",
                    title: "Support Resources",
                    url: "https://discord.gg/ZzDhKgACbh",
                    type: "Community"
                }
            ]
        };

        return NextResponse.json({
            success: true,
            data: resources
        });

    } catch (error) {
        console.error("Get Resources Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
