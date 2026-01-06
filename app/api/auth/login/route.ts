import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { sessionOptions, SessionData } from "@/lib/session";
import { LoginRequest, LoginResponse } from "@/types/api";

// Simple in-memory rate limiter
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute
    return true;
  }

  if (attempt.count >= 5) {
    return false;
  }

  attempt.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts. Please try again later.",
        } as LoginResponse,
        { status: 429 }
      );
    }

    const body: LoginRequest = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        } as LoginResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const user = await db
      .collection(COLLECTIONS.ADMIN_USERS)
      .findOne({ username });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        } as LoginResponse,
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        } as LoginResponse,
        { status: 401 }
      );
    }

    // Update last login
    await db
      .collection(COLLECTIONS.ADMIN_USERS)
      .updateOne({ _id: user._id }, { $set: { last_login: new Date() } });

    // Create session
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    session.user = {
      id: user._id.toString(),
      username: user.username,
      isLoggedIn: true,
    };

    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    } as LoginResponse);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login",
      } as LoginResponse,
      { status: 500 }
    );
  }
}
