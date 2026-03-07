import { NextRequest, NextResponse } from "next/server";
import { prisma, generateQrToken } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const participants = await prisma.participant.findMany({
      where: { eventId },
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

    if (event.maxParticipants) {
      const count = await prisma.participant.count({ where: { eventId } });
      if (count >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Event has reached maximum participants" },
          { status: 400 }
        );
      }
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
