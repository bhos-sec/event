import { NextRequest, NextResponse } from "next/server";
import { getDb, generateQrToken } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if ((c === "," && !inQuotes) || c === "\t") {
      result.push(current);
      current = "";
    } else current += c;
  }
  result.push(current);
  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const text = await request.text();

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

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have header row and at least one data row" },
        { status: 400 }
      );
    }

    const headerCols = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const nameIdx = headerCols.findIndex((h) => /name/.test(h)) >= 0 ? headerCols.findIndex((h) => /name/.test(h)) : 0;
    const emailIdx = headerCols.findIndex((h) => /email/.test(h)) >= 0 ? headerCols.findIndex((h) => /email/.test(h)) : 1;
    const phoneIdx = headerCols.findIndex((h) => /phone/.test(h));

    const participantsSnap = await db.collection("participants").where("eventId", "==", eventId).get();
    const existingEmails = new Set(participantsSnap.docs.map((d) => d.data().email));
    const waitlistSnap = await db.collection("waitlist").where("eventId", "==", eventId).get();
    const waitlistEmails = new Set(waitlistSnap.docs.map((d) => d.data().email));

    const max = event.maxParticipants ?? Infinity;
    const created: { id: string; name: string; email: string }[] = [];
    const skipped: string[] = [];
    const waitlisted: string[] = [];
    let count = participantsSnap.size;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = (cols[nameIdx] || "").trim();
      const email = (cols[emailIdx] || "").trim().toLowerCase();
      if (!name || !email) continue;

      if (existingEmails.has(email)) {
        skipped.push(email);
        continue;
      }

      if (count >= max) {
        const wlRef = db.collection("waitlist").doc();
        await wlRef.set({
          eventId,
          email,
          name,
          phone: phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || null : null,
          joinedAt: Timestamp.now(),
        });
        waitlisted.push(email);
        waitlistEmails.add(email);
        continue;
      }

      const ref = db.collection("participants").doc();
      await ref.set({
        eventId,
        email,
        name,
        phone: phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || null : null,
        qrToken: generateQrToken(),
        registeredAt: Timestamp.now(),
      });
      created.push({ id: ref.id, name, email });
      existingEmails.add(email);
      count++;
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      waitlisted: waitlisted.length,
      participants: created,
    });
  } catch (error) {
    console.error("Failed to import participants:", error);
    return NextResponse.json(
      { error: "Failed to import participants" },
      { status: 500 }
    );
  }
}
