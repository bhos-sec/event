import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firestore";

function toDate(v: { toDate?: () => Date } | string | null) {
  if (!v) return null;
  if (typeof v === "object" && "toDate" in v && typeof v.toDate === "function")
    return v.toDate().toISOString();
  return typeof v === "string" ? v : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const doc = await db.collection("events").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const d = doc.data()!;
    const [participantsSnap, checkInsSnap, waitlistSnap] = await Promise.all([
      db.collection("participants").where("eventId", "==", id).get(),
      db.collection("checkIns").where("eventId", "==", id).get(),
      db.collection("waitlist").where("eventId", "==", id).get(),
    ]);
    return NextResponse.json({
      id: doc.id,
      ...d,
      startDate: toDate(d.startDate),
      endDate: toDate(d.endDate),
      registrationDeadline: toDate(d.registrationDeadline),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
      _count: {
        participants: participantsSnap.size,
        checkIns: checkInsSnap.size,
        waitlist: waitlistSnap.size,
      },
    });
  } catch (error) {
    console.error("Failed to fetch event");
    return NextResponse.json(
      { error: "Failed to fetch event" },
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
    const {
      name,
      description,
      location,
      category,
      startDate,
      endDate,
      maxParticipants,
      registrationDeadline,
      status,
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (category !== undefined) updates.category = category?.trim() || null;
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (maxParticipants !== undefined)
      updates.maxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : null;
    if (registrationDeadline !== undefined)
      updates.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : null;
    if (
      status !== undefined &&
      ["draft", "published", "cancelled"].includes(status)
    )
      updates.status = status;

    if (Object.keys(updates).length === 0) {
      const doc = await db.collection("events").doc(id).get();
      if (!doc.exists) return NextResponse.json({ error: "Event not found" }, { status: 404 });
      const d = doc.data()!;
      return NextResponse.json({
        id: doc.id,
        ...d,
        startDate: toDate(d.startDate),
        endDate: toDate(d.endDate),
        registrationDeadline: toDate(d.registrationDeadline),
        createdAt: toDate(d.createdAt),
        updatedAt: toDate(d.updatedAt),
      });
    }

    const { Timestamp } = await import("firebase-admin/firestore");
    const firestoreUpdates: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() };
    if (updates.startDate) firestoreUpdates.startDate = Timestamp.fromDate(updates.startDate as Date);
    if (updates.endDate) firestoreUpdates.endDate = updates.endDate ? Timestamp.fromDate(updates.endDate as Date) : null;
    if (updates.registrationDeadline)
      firestoreUpdates.registrationDeadline =
        updates.registrationDeadline ?
          Timestamp.fromDate(updates.registrationDeadline as Date) : null;

    await db.collection("events").doc(id).update(firestoreUpdates);
    const doc = await db.collection("events").doc(id).get();
    const d = doc.data()!;
    const [participantsSnap, checkInsSnap, waitlistSnap] = await Promise.all([
      db.collection("participants").where("eventId", "==", id).get(),
      db.collection("checkIns").where("eventId", "==", id).get(),
      db.collection("waitlist").where("eventId", "==", id).get(),
    ]);
    return NextResponse.json({
      id: doc.id,
      ...d,
      startDate: toDate(d.startDate),
      endDate: toDate(d.endDate),
      registrationDeadline: toDate(d.registrationDeadline),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
      _count: {
        participants: participantsSnap.size,
        checkIns: checkInsSnap.size,
        waitlist: waitlistSnap.size,
      },
    });
  } catch (error) {
    console.error("Failed to update event");
    return NextResponse.json(
      { error: "Failed to update event" },
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
    const batch = db.batch();
    const [participants, checkIns, waitlist, feedback] = await Promise.all([
      db.collection("participants").where("eventId", "==", id).get(),
      db.collection("checkIns").where("eventId", "==", id).get(),
      db.collection("waitlist").where("eventId", "==", id).get(),
      db.collection("eventFeedback").where("eventId", "==", id).get(),
    ]);
    participants.docs.forEach((d) => batch.delete(d.ref));
    checkIns.docs.forEach((d) => batch.delete(d.ref));
    waitlist.docs.forEach((d) => batch.delete(d.ref));
    feedback.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection("events").doc(id));
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event");
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
