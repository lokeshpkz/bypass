import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { SessionResponse } from "@/types/api";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    if (session.user?.isLoggedIn) {
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          username: session.user.username,
        },
      } as SessionResponse);
    }

    return NextResponse.json({
      isAuthenticated: false,
    } as SessionResponse);
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        isAuthenticated: false,
      } as SessionResponse,
      { status: 500 }
    );
  }
}
