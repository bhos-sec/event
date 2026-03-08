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

    let participantDoc: { id: string; data: () => Record<string, unknown> } | null = null;
    if (qrToken) {
      const snap = await db.collection("participants").where("eventId", "==", eventId).where("qrToken", "==", qrToken).get();
      if (!snap.empty) participantDoc = snap.docs[0];
    } else {
      const p = await db.collection("participants").doc(participantId).get();
      if (p.exists && p.data()?.eventId === eventId) {
        participantDoc = { id: p.id, data: () => (p.data() ?? {}) as Record<string, unknown> };
      }
    }

    if (!participantDoc) {
      return NextResponse.json(
        { error: "Invalid QR code or participant not registered for this event" },
        { status: 404 }
      );
    }

    const pid = participantDoc.id;
    const pData = participantDoc.data() ?? {};

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
    console.error("Failed to check in");
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
