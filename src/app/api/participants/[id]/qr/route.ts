import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getDb } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "svg";

    const doc = await db.collection("participants").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }
    const participant = doc.data()!;
    const eventId = participant.eventId;

    const checkInUrl = `${request.nextUrl.origin}/check-in/${eventId}?token=${participant.qrToken}`;
    const qrData = JSON.stringify({
      token: participant.qrToken,
      eventId,
      participantId: id,
      url: checkInUrl,
    });

    if (format === "png") {
      const pngBuffer = await QRCode.toBuffer(qrData, {
        type: "png",
        width: 300,
        margin: 2,
      });
      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="qr-${id}.png"`,
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
        "Content-Disposition": `inline; filename="qr-${id}.svg"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
