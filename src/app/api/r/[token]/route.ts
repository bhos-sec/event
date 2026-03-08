import { NextRequest, NextResponse } from "next/server";
import { prisma, generateQrToken } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const participant = await prisma.participant.findUnique({
      where: { qrToken: token },
      include: {
        event: { select: { id: true, name: true, startDate: true, location: true } },
        _count: { select: { checkIns: true } },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      registeredAt: participant.registeredAt,
      event: participant.event,
      checkedIn: participant._count.checkIns > 0,
    });
  } catch (error) {
    console.error("Failed to fetch registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, phone } = body;

    const participant = await prisma.participant.findUnique({
      where: { qrToken: token },
    });

    if (!participant) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        ...(name !== undefined && { name: name?.trim() || participant.name }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
      },
      include: { event: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update registration:", error);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const participant = await prisma.participant.findUnique({
      where: { qrToken: token },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const eventId = participant.eventId;
    const event = participant.event;
    const maxParticipants = event.maxParticipants;

    await prisma.participant.delete({ where: { id: participant.id } });

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
    console.error("Failed to cancel registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
}
