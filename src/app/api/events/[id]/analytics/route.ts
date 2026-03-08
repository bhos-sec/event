import { NextRequest, NextResponse } from "next/server";
import { getDb, toDate } from "@/lib/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const eventData = eventDoc.data()!;

    const [participantsSnap, checkInsSnap] = await Promise.all([
      db.collection("participants").where("eventId", "==", eventId).get(),
      db.collection("checkIns").where("eventId", "==", eventId).get(),
    ]);

    const totalParticipants = participantsSnap.size;
    const totalCheckIns = checkInsSnap.size;
    const attendanceRate =
      totalParticipants > 0
        ? Math.round((totalCheckIns / totalParticipants) * 100)
        : 0;

    const hourCounts: Record<number, number> = {};
    checkInsSnap.docs.forEach((doc) => {
      const d = doc.data();
      const ts = d.checkedInAt?.toDate?.();
      if (ts) {
        const h = ts.getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    const checkInsByHour = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour, 10), count }))
      .sort((a, b) => a.hour - b.hour);

    return NextResponse.json({
      event: {
        id: eventDoc.id,
        name: eventData.name,
        startDate: toDate(eventData.startDate),
      },
      summary: {
        totalParticipants,
        totalCheckIns,
        attendanceRate,
        noShow: totalParticipants - totalCheckIns,
      },
      checkInsByHour,
    });
  } catch (error) {
    console.error("Failed to fetch analytics");
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
