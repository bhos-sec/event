import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
