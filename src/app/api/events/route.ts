import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "";

    const events = await prisma.event.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { participants: true, checkIns: true },
        },
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, location, category, startDate, endDate, maxParticipants, registrationDeadline, status } = body;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: "Name and start date are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        location: location || null,
        category: category?.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        status: status === "published" || status === "cancelled" ? status : "draft",
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
