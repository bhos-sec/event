import { NextRequest, NextResponse } from "next/server";
import { prisma, generateQrToken } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Failed to fetch participant:", error);
    return NextResponse.json(
      { error: "Failed to fetch participant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const participant = await prisma.participant.update({
      where: { id },
      data: { ...(notes !== undefined && { notes: notes?.trim() || null }) },
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error("Failed to update participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const eventId = participant.eventId;
    const event = participant.event;
    const maxParticipants = event.maxParticipants;

    await prisma.participant.delete({ where: { id } });

    let promoted: { id: string; name: string; email: string } | null = null;
    if (maxParticipants) {
      const count = await prisma.participant.count({ where: { eventId } });
      if (count < maxParticipants) {
        const first = await prisma.waitlistEntry.findFirst({
          where: { eventId },
          orderBy: { joinedAt: "asc" },
        });
        if (first) {
          const newParticipant = await prisma.participant.create({
            data: {
              eventId,
              email: first.email,
              name: first.name,
              phone: first.phone,
              qrToken: generateQrToken(),
            },
          });
          await prisma.waitlistEntry.delete({ where: { id: first.id } });
          promoted = { id: newParticipant.id, name: newParticipant.name, email: newParticipant.email };
        }
      }
    }

    return NextResponse.json({ success: true, promoted });
  } catch (error) {
    console.error("Failed to remove participant:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
