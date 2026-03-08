import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "";

    type EventDoc = {
      name?: string; description?: string; location?: string; status?: string;
      startDate?: unknown; endDate?: unknown; registrationDeadline?: unknown;
      createdAt?: unknown; updatedAt?: unknown;
    };
    const snapshot = await db.collection("events").orderBy("startDate", "desc").get();
    let events = snapshot.docs.map((doc) => {
      const d = doc.data() as EventDoc;
      const toIso = (v: unknown) =>
        (v as { toDate?: () => Date })?.toDate?.()?.toISOString?.() ?? (typeof v === "string" ? v : null);
      return {
        id: doc.id,
        ...d,
        name: d.name ?? null,
        description: d.description ?? null,
        location: d.location ?? null,
        status: d.status ?? "draft",
        startDate: toIso(d.startDate),
        endDate: toIso(d.endDate),
        registrationDeadline: toIso(d.registrationDeadline),
        createdAt: toIso(d.createdAt),
        updatedAt: toIso(d.updatedAt),
        _count: { participants: 0, checkIns: 0 },
      };
    });

    if (status) events = events.filter((e) => e.status === status);
    if (search) {
      const s = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.name?.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s) ||
          e.location?.toLowerCase().includes(s)
      );
    }

    for (const e of events) {
      const [parts, checkIns] = await Promise.all([
        db.collection("participants").where("eventId", "==", e.id).get(),
        db.collection("checkIns").where("eventId", "==", e.id).get(),
      ]);
      e._count = { participants: parts.size, checkIns: checkIns.size };
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
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
      createdByUid,
    } = body;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: "Name and start date are required" },
        { status: 400 }
      );
    }

    const eventRef = db.collection("events").doc();
    const event = {
      name,
      description: description || null,
      location: location || null,
      category: category?.trim() || null,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      registrationDeadline: registrationDeadline
        ? Timestamp.fromDate(new Date(registrationDeadline))
        : null,
      status: status === "published" || status === "cancelled" ? status : "draft",
      createdByUid: createdByUid || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await eventRef.set(event);

    return NextResponse.json({
      id: eventRef.id,
      ...event,
      startDate: event.startDate.toDate().toISOString(),
      endDate: event.endDate?.toDate().toISOString() ?? null,
      registrationDeadline: event.registrationDeadline?.toDate().toISOString() ?? null,
      createdAt: event.createdAt.toDate().toISOString(),
      updatedAt: event.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
