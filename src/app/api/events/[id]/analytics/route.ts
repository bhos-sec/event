import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { participants: true, checkIns: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkInsByHour = await prisma.$queryRaw<
      { hour: number; count: bigint }[]
    >`
      SELECT EXTRACT(HOUR FROM "checkedInAt")::int as hour, COUNT(*)::bigint as count
      FROM "CheckIn"
      WHERE "eventId" = ${eventId}
      GROUP BY EXTRACT(HOUR FROM "checkedInAt")
      ORDER BY hour
    `;

    const totalParticipants = event._count.participants;
    const totalCheckIns = event._count.checkIns;
    const attendanceRate =
      totalParticipants > 0
        ? Math.round((totalCheckIns / totalParticipants) * 100)
        : 0;

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
      },
      summary: {
        totalParticipants,
        totalCheckIns,
        attendanceRate,
        noShow: totalParticipants - totalCheckIns,
      },
      checkInsByHour: checkInsByHour.map((r) => ({
        hour: r.hour,
        count: Number(r.count),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
