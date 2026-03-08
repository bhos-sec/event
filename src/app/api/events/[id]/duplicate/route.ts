import { NextRequest, NextResponse } from "next/server";
import { getDb, generateQrToken, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const originalDoc = await db.collection("events").doc(id).get();
    if (!originalDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const original = originalDoc.data()!;
    const startDate = original.startDate?.toDate?.() ?? new Date();
    const endDate = original.endDate?.toDate?.();

    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = endDate ? (() => {
      const d = new Date(endDate);
      d.setDate(d.getDate() + 7);
      return d;
    })() : null;

    const newEventRef = db.collection("events").doc();
    await newEventRef.set({
      name: `${original.name} (Copy)`,
      description: original.description,
      location: original.location,
      category: original.category,
      startDate: Timestamp.fromDate(newStart),
      endDate: newEnd ? Timestamp.fromDate(newEnd) : null,
      maxParticipants: original.maxParticipants,
      registrationDeadline: null,
      status: "draft",
      createdByUid: original.createdByUid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const participantsSnap = await db.collection("participants").where("eventId", "==", id).get();
    for (const p of participantsSnap.docs) {
      const d = p.data();
      try {
        const existing = await db.collection("participants").where("eventId", "==", newEventRef.id).where("email", "==", d.email).get();
        if (existing.empty) {
          await db.collection("participants").add({
            eventId: newEventRef.id,
            email: d.email,
            name: d.name,
            phone: d.phone,
            qrToken: generateQrToken(),
            registeredAt: Timestamp.now(),
          });
        }
      } catch {
        // skip duplicates
      }
    }

    const newDoc = await newEventRef.get();
    const newData = newDoc.data()!;
    const [participantsCount, checkInsCount] = await Promise.all([
      db.collection("participants").where("eventId", "==", newEventRef.id).get(),
      db.collection("checkIns").where("eventId", "==", newEventRef.id).get(),
    ]);

    return NextResponse.json({
      id: newEventRef.id,
      ...newData,
      startDate: toDate(newData.startDate),
      endDate: toDate(newData.endDate),
      registrationDeadline: toDate(newData.registrationDeadline),
      createdAt: toDate(newData.createdAt),
      updatedAt: toDate(newData.updatedAt),
      _count: { participants: participantsCount.size, checkIns: checkInsCount.size },
    });
  } catch (error) {
    console.error("Failed to duplicate event:", error);
    return NextResponse.json(
      { error: "Failed to duplicate event" },
      { status: 500 }
    );
  }
}
