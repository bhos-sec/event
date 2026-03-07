import { NextRequest, NextResponse } from "next/server";
import { prisma, generateQrToken } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const text = await request.text();

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
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

    const count = await prisma.participant.count({ where: { eventId } });
    const max = event.maxParticipants ?? Infinity;
    const created: { id: string; name: string; email: string }[] = [];
    const skipped: string[] = [];
    const waitlisted: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const name = (cols[nameIdx] || "").trim();
      const email = (cols[emailIdx] || "").trim().toLowerCase();
      if (!name || !email) continue;

      const exists = await prisma.participant.findUnique({
        where: { eventId_email: { eventId, email } },
      });
      if (exists) {
        skipped.push(email);
        continue;
      }

      if (count + created.length >= max) {
        await prisma.waitlistEntry.upsert({
          where: { eventId_email: { eventId, email } },
          create: { eventId, email, name, phone: phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || null : null },
          update: { name },
        });
        waitlisted.push(email);
        continue;
      }

      const p = await prisma.participant.create({
        data: {
          eventId,
          email,
          name,
          phone: phoneIdx >= 0 ? (cols[phoneIdx] || "").trim() || null : null,
          qrToken: generateQrToken(),
        },
      });
      created.push({ id: p.id, name: p.name, email: p.email });
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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || c === "\t") {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
