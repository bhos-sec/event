import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participants = await prisma.participant.findMany({
      where: { eventId },
      include: {
        _count: { select: { checkIns: true } },
      },
      orderBy: { registeredAt: "asc" },
    });

    if (format === "csv") {
      const header = "Name,Email,Phone,Registered At,Checked In\n";
      const rows = participants.map(
        (p) =>
          `"${(p.name || "").replace(/"/g, '""')}","${(p.email || "").replace(/"/g, '""')}","${(p.phone || "").replace(/"/g, '""')}","${new Date(p.registeredAt).toISOString()}",${p._count.checkIns > 0 ? "Yes" : "No"}`
      ).join("\n");
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
    console.error("Failed to export participants:", error);
    return NextResponse.json(
      { error: "Failed to export participants" },
      { status: 500 }
    );
  }
}
