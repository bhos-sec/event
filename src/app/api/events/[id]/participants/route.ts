import { NextRequest, NextResponse } from "next/server";
import { prisma, generateQrToken } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();

    const participants = await prisma.participant.findMany({
      where: {
        eventId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      },
      include: {
        _count: { select: { checkIns: true } },
      },
      orderBy: { registeredAt: "desc" },
    });
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
    const { id: eventId } = await params;
    const body = await request.json();
    const { email, name, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json(
        { error: "Registration has closed" },
        { status: 400 }
      );
    }

    const count = await prisma.participant.count({ where: { eventId } });
    const isFull = event.maxParticipants ? count >= event.maxParticipants : false;

    if (isFull) {
      // Add to waitlist instead
      const waitlist = await prisma.waitlistEntry.upsert({
        where: {
          eventId_email: { eventId, email: email.toLowerCase().trim() },
        },
        create: {
          eventId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          phone: phone?.trim() || null,
        },
        update: { name: name.trim(), phone: phone?.trim() || null },
      });
      return NextResponse.json({ waitlist: true, entry: waitlist });
    }

    const participant = await prisma.participant.create({
      data: {
        eventId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone?.trim() || null,
        qrToken: generateQrToken(),
      },
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Failed to register participant:", error);
    return NextResponse.json(
      { error: "Failed to register participant" },
      { status: 500 }
    );
  }
}
