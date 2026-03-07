import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { participantIds } = body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: "participantIds array is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkedIn: string[] = [];
    const alreadyCheckedIn: string[] = [];
    const notFound: string[] = [];

    for (const pid of participantIds) {
      const participant = await prisma.participant.findFirst({
        where: { id: pid, eventId },
      });
      if (!participant) {
        notFound.push(pid);
        continue;
      }

      const existing = await prisma.checkIn.findUnique({
        where: {
          participantId_eventId: { participantId: participant.id, eventId },
        },
      });
      if (existing) {
        alreadyCheckedIn.push(pid);
        continue;
      }

      await prisma.checkIn.create({
        data: {
          participantId: participant.id,
          eventId,
          source: "manual",
        },
      });
      checkedIn.push(pid);
    }

    return NextResponse.json({
      checkedIn: checkedIn.length,
      alreadyCheckedIn: alreadyCheckedIn.length,
      notFound: notFound.length,
      ids: { checkedIn, alreadyCheckedIn, notFound },
    });
  } catch (error) {
    console.error("Failed to bulk check-in:", error);
    return NextResponse.json(
      { error: "Failed to bulk check-in" },
      { status: 500 }
    );
  }
}
