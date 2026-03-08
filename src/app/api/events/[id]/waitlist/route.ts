import { NextRequest, NextResponse } from "next/server";
import { getDb, toDate } from "@/lib/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const snapshot = await db.collection("waitlist").where("eventId", "==", eventId).get();
    const entries = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          joinedAt: toDate(d.joinedAt),
        };
      })
      .sort((a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || ""));
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch waitlist");
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
