import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const body = await request.json();
    const { participantIds } = body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: "participantIds array is required" },
        { status: 400 }
      );
    }

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkedIn: string[] = [];
    const alreadyCheckedIn: string[] = [];
    const notFound: string[] = [];

    for (const pid of participantIds) {
      const pDoc = await db.collection("participants").doc(pid).get();
      if (!pDoc.exists || pDoc.data()?.eventId !== eventId) {
        notFound.push(pid);
        continue;
      }

      const existing = await db.collection("checkIns").where("participantId", "==", pid).where("eventId", "==", eventId).get();
      if (!existing.empty) {
        alreadyCheckedIn.push(pid);
        continue;
      }

      await db.collection("checkIns").add({
        participantId: pid,
        eventId,
        checkedInAt: Timestamp.now(),
        source: "manual",
      });
      checkedIn.push(pid);
    }

    return NextResponse.json({
      checkedIn: checkedIn.length,
      alreadyCheckedIn: alreadyCheckedIn.length,
      notFound: notFound.length,
      ids: { checkedIn, alreadyCheckedIn, notFound },
    });
  } catch (error) {
    console.error("Failed to bulk check-in", error);
    return NextResponse.json(
      { error: "Failed to bulk check-in" },
      { status: 500 }
    );
  }
}
