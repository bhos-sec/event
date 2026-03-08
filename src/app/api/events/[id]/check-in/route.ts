import { NextRequest, NextResponse } from "next/server";
import { getDb, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const body = await request.json();
    const { qrToken, participantId } = body;

    if (!qrToken && !participantId) {
      return NextResponse.json(
        { error: "QR token or participant ID is required" },
        { status: 400 }
      );
    }

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let participantSnap: { empty: boolean; docs: { id: string; data: () => Record<string, unknown> }[] };
    if (qrToken) {
      participantSnap = await db.collection("participants").where("eventId", "==", eventId).where("qrToken", "==", qrToken).get();
    } else {
      const p = await db.collection("participants").doc(participantId).get();
      participantSnap = !p.exists || p.data()?.eventId !== eventId
        ? { empty: true, docs: [] }
        : { empty: false, docs: [p] };
    }

    if (participantSnap.empty || participantSnap.docs.length === 0) {
      return NextResponse.json(
        { error: "Invalid QR code or participant not registered for this event" },
        { status: 404 }
      );
    }

    const participant = participantSnap.docs[0];
    const pid = participant.id;
    const pData = participant.data();

    const existingCheckIn = await db.collection("checkIns").where("participantId", "==", pid).where("eventId", "==", eventId).get();
    if (!existingCheckIn.empty) {
      return NextResponse.json(
        { error: "Already checked in", checkIn: { id: existingCheckIn.docs[0].id } },
        { status: 400 }
      );
    }

    const checkInRef = db.collection("checkIns").doc();
    await checkInRef.set({
      participantId: pid,
      eventId,
      checkedInAt: Timestamp.now(),
      source: qrToken ? "qr" : "manual",
    });

    return NextResponse.json({
      id: checkInRef.id,
      participant: { name: pData.name },
    });
  } catch (error) {
    console.error("Failed to check in:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
