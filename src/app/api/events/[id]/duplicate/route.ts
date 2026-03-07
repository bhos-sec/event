import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const original = await prisma.event.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const newStart = new Date(original.startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = original.endDate
      ? (() => {
          const d = new Date(original.endDate);
          d.setDate(d.getDate() + 7);
          return d;
        })()
      : null;

    const duplicated = await prisma.event.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        location: original.location,
        startDate: newStart,
        endDate: newEnd,
        maxParticipants: original.maxParticipants,
        status: "draft",
      },
    });

    for (const p of original.participants) {
      await prisma.participant.create({
        data: {
          eventId: duplicated.id,
          email: p.email,
          name: p.name,
          phone: p.phone,
          qrToken: crypto.randomUUID(),
        },
      }).catch(() => {}); // skip if duplicate email
    }

    const withCounts = await prisma.event.findUnique({
      where: { id: duplicated.id },
      include: {
        _count: { select: { participants: true, checkIns: true } },
      },
    });

    return NextResponse.json(withCounts);
  } catch (error) {
    console.error("Failed to duplicate event:", error);
    return NextResponse.json(
      { error: "Failed to duplicate event" },
      { status: 500 }
    );
  }
}
