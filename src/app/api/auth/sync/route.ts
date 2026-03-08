import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Sync Firebase Auth user to our database.
 * Called by the client when Firebase auth state changes (Google or email/password).
 * Firebase handles the actual sign-in; we just persist the user in PostgreSQL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "uid and email are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      create: {
        firebaseUid: uid,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
      },
      update: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
      },
    });

    return NextResponse.json({ id: user.id });
  } catch (error) {
    console.error("Auth sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
