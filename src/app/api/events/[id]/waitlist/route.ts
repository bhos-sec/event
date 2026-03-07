import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const entries = await prisma.waitlistEntry.findMany({
      where: { eventId },
      orderBy: { joinedAt: "asc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
