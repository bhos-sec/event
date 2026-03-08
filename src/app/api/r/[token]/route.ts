import { NextRequest, NextResponse } from "next/server";
import { getDb, generateQrToken, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const db = getDb();
    const { token } = await params;
    const snapshot = await db.collection("participants").where("qrToken", "==", token).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const doc = snapshot.docs[0];
    const d = doc.data();
    const eventDoc = await db.collection("events").doc(d.eventId).get();
    const eventData = eventDoc.data()!;
    const checkInsSnap = await db.collection("checkIns").where("participantId", "==", doc.id).where("eventId", "==", d.eventId).get();
    return NextResponse.json({
      id: doc.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      registeredAt: toDate(d.registeredAt),
      event: {
        id: d.eventId,
        name: eventData.name,
        startDate: toDate(eventData.startDate),
        location: eventData.location,
      },
      checkedIn: checkInsSnap.size > 0,
    });
  } catch (error) {
    console.error("Failed to fetch registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const db = getDb();
    const { token } = await params;
    const body = await request.json();
    const { name, phone } = body;

    const snapshot = await db.collection("participants").where("qrToken", "==", token).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const doc = snapshot.docs[0];
    const d = doc.data();

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name?.trim() || d.name;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
    }

    const updated = await doc.ref.get();
    const u = updated.data()!;
    const eventDoc = await db.collection("events").doc(u.eventId).get();
    return NextResponse.json({
      id: updated.id,
      ...u,
      event: { id: u.eventId, name: eventDoc.data()?.name },
    });
  } catch (error) {
    console.error("Failed to update registration:", error);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const db = getDb();
    const { token } = await params;
    const snapshot = await db.collection("participants").where("qrToken", "==", token).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    const doc = snapshot.docs[0];
    const d = doc.data();
    const eventId = d.eventId;

    const eventDoc = await db.collection("events").doc(eventId).get();
    const event = eventDoc.data()!;
    const maxParticipants = event?.maxParticipants;

    await doc.ref.delete();
    const checkInsSnap = await db.collection("checkIns").where("participantId", "==", doc.id).get();
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
    console.error("Failed to cancel registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}
