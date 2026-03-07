import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "svg";

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const checkInUrl = `${request.nextUrl.origin}/check-in/${participant.eventId}?token=${participant.qrToken}`;
    const qrData = JSON.stringify({
      token: participant.qrToken,
      eventId: participant.eventId,
      participantId: participant.id,
      url: checkInUrl,
    });

    if (format === "png") {
      const pngBuffer = await QRCode.toBuffer(qrData, {
        type: "png",
        width: 300,
        margin: 2,
      });
      return new NextResponse(pngBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="qr-${participant.id}.png"`,
        },
      });
    }

    const svg = await QRCode.toString(qrData, {
      type: "svg",
      width: 300,
      margin: 2,
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="qr-${participant.id}.svg"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
