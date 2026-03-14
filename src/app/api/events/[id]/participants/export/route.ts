import { NextRequest, NextResponse } from "next/server";
import { getDb, toDate } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = eventDoc.data()!;

    const participantsSnap = await db.collection("participants").where("eventId", "==", eventId).get();
    const checkInsSnap = await db.collection("checkIns").where("eventId", "==", eventId).get();
    const checkedInIds = new Set(checkInsSnap.docs.map((d) => d.data().participantId));

    const participants = participantsSnap.docs
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          registeredAt: toDate(d.registeredAt as { toDate?: () => Date }),
          checkedIn: checkedInIds.has(doc.id),
        };
      })
      .sort((a, b) => (a.registeredAt || "").localeCompare(b.registeredAt || ""));

    if (format === "csv") {
      const header = "Name,Email,Phone,Registered At,Checked In\n";
      const rows = participants
      .map(
        (p) =>
          `"${String(p.name || "").replace(/"/g, '""')}","${String(p.email || "").replace(/"/g, '""')}","${String(p.phone || "").replace(/"/g, '""')}","${p.registeredAt || ""}",${p.checkedIn ? "Yes" : "No"}`
      )
        .join("\n");
      const csv = header + rows;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, "_")}_participants.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Failed to export participants", error);
    return NextResponse.json(
      { error: "Failed to export participants" },
      { status: 500 }
    );
  }
}
