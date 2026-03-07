import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { qrToken, participantId } = body;

    if (!qrToken && !participantId) {
      return NextResponse.json(
        { error: "QR token or participant ID is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let participant;
    if (qrToken) {
      participant = await prisma.participant.findFirst({
        where: { eventId, qrToken },
      });
    } else {
      participant = await prisma.participant.findFirst({
        where: { id: participantId, eventId },
      });
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Invalid QR code or participant not registered for this event" },
        { status: 404 }
      );
    }

    const existing = await prisma.checkIn.findUnique({
      where: {
        participantId_eventId: { participantId: participant.id, eventId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in", checkIn: existing },
        { status: 400 }
      );
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        participantId: participant.id,
        eventId,
        source: qrToken ? "qr" : "manual",
      },
      include: {
        participant: true,
      },
    });

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error("Failed to check in:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
