import { NextRequest, NextResponse } from "next/server";
import { getDb, generateQrToken, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();

    const snapshot = await db.collection("participants").where("eventId", "==", eventId).get();

    let participants = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          registeredAt: toDate(d.registeredAt),
          _count: { checkIns: 0 },
        };
      })
      .sort((a, b) => (b.registeredAt || "").localeCompare(a.registeredAt || ""));

    if (search) {
      participants = participants.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.phone?.toLowerCase().includes(search)
      );
    }

    for (const p of participants) {
      const checkInsSnap = await db.collection("checkIns").where("participantId", "==", p.id).where("eventId", "==", eventId).get();
      p._count = { checkIns: checkInsSnap.size };
    }

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Failed to fetch participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const body = await request.json();
    const { email, name, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = eventDoc.data()!;

    const deadline = event.registrationDeadline?.toDate?.();
    if (deadline && new Date() > deadline) {
      return NextResponse.json(
        { error: "Registration has closed" },
        { status: 400 }
      );
    }

    const participantsSnap = await db.collection("participants").where("eventId", "==", eventId).get();
    const count = participantsSnap.size;
    const max = event.maxParticipants ?? Infinity;
    const isFull = count >= max;
    const emailLo = email.toLowerCase().trim();

    if (isFull) {
      const waitlistRef = db.collection("waitlist").doc();
      await waitlistRef.set({
        eventId,
        email: emailLo,
        name: name.trim(),
        phone: phone?.trim() || null,
        joinedAt: Timestamp.now(),
      });
      return NextResponse.json({
        waitlist: true,
        entry: {
          id: waitlistRef.id,
          email: emailLo,
          name: name.trim(),
          phone: phone?.trim() || null,
          joinedAt: new Date().toISOString(),
        },
      });
    }

    const existing = await db.collection("participants").where("eventId", "==", eventId).where("email", "==", emailLo).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Already registered with this email" }, { status: 400 });
    }

    const participantRef = db.collection("participants").doc();
    const participant = {
      eventId,
      email: emailLo,
      name: name.trim(),
      phone: phone?.trim() || null,
      qrToken: generateQrToken(),
      registeredAt: Timestamp.now(),
    };
    await participantRef.set(participant);

    return NextResponse.json({
      id: participantRef.id,
      ...participant,
      registeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to register participant:", error);
    return NextResponse.json(
      { error: "Failed to register participant" },
      { status: 500 }
    );
  }
}
