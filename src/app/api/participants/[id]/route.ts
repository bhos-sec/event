import { NextRequest, NextResponse } from "next/server";
import { getDb, generateQrToken, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const doc = await db.collection("participants").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }
    const d = doc.data()!;
    const eventDoc = await db.collection("events").doc(d.eventId).get();
    const event = eventDoc.exists ? eventDoc.data()! : {};
    return NextResponse.json({
      id: doc.id,
      ...d,
      registeredAt: toDate(d.registeredAt),
      event: {
        id: d.eventId,
        name: event.name,
      },
    });
  } catch (error) {
    console.error("Failed to fetch participant", error);
    return NextResponse.json(
      { error: "Failed to fetch participant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const doc = await db.collection("participants").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (notes !== undefined) {
      await db.collection("participants").doc(id).update({ notes: notes?.trim() || null });
    }

    const updated = await db.collection("participants").doc(id).get();
    const d = updated.data()!;
    const eventDoc = await db.collection("events").doc(d.eventId).get();
    return NextResponse.json({
      id: updated.id,
      ...d,
      registeredAt: toDate(d.registeredAt),
      event: eventDoc.exists ? { id: d.eventId, name: eventDoc.data()?.name } : { id: d.eventId, name: null },
    });
  } catch (error) {
    console.error("Failed to update participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const doc = await db.collection("participants").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }
    const d = doc.data()!;
    const eventId = d.eventId;

    const eventDoc = await db.collection("events").doc(eventId).get();
    const event = eventDoc.data()!;
    const maxParticipants = event?.maxParticipants;

    await db.collection("participants").doc(id).delete();
    const checkInsSnap = await db.collection("checkIns").where("participantId", "==", id).get();
    for (const c of checkInsSnap.docs) await c.ref.delete();

    let promoted: { id: string; name: string; email: string } | null = null;
    if (maxParticipants) {
      const countSnap = await db.collection("participants").where("eventId", "==", eventId).get();
      if (countSnap.size < maxParticipants) {
        const wlSnap = await db.collection("waitlist").where("eventId", "==", eventId).get();
        const sorted = wlSnap.docs.sort((a, b) => {
          const aT = a.data().joinedAt?.toDate?.()?.getTime?.() ?? 0;
          const bT = b.data().joinedAt?.toDate?.()?.getTime?.() ?? 0;
          return aT - bT;
        });
        if (sorted.length > 0) {
          const first = sorted[0];
          const wlData = first.data();
          const newRef = db.collection("participants").doc();
          await newRef.set({
            eventId,
            email: wlData.email,
            name: wlData.name,
            phone: wlData.phone,
            qrToken: generateQrToken(),
            registeredAt: Timestamp.now(),
          });
          await first.ref.delete();
          promoted = { id: newRef.id, name: wlData.name, email: wlData.email };
        }
      }
    }

    return NextResponse.json({ success: true, promoted });
  } catch (error) {
    console.error("Failed to remove participant", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
