import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const feedback = await prisma.eventFeedback.findMany({
      where: { eventId },
      include: { participant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
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
    const { participantId, rating, comment } = body;

    if (!participantId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "participantId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findFirst({
      where: { id: participantId, eventId },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found for this event" },
        { status: 404 }
      );
    }

    const feedback = await prisma.eventFeedback.upsert({
      where: {
        participantId_eventId: { participantId, eventId },
      },
      create: {
        eventId,
        participantId,
        rating,
        comment: comment?.trim() || null,
      },
      update: {
        rating,
        comment: comment?.trim() || null,
      },
      include: { participant: { select: { name: true } } },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
