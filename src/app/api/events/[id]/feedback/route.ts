import { NextRequest, NextResponse } from "next/server";
import { getDb, toDate } from "@/lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id: eventId } = await params;
    const snapshot = await db.collection("eventFeedback").where("eventId", "==", eventId).get();
    const feedback = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const d = doc.data();
        const pDoc = await db.collection("participants").doc(d.participantId).get();
        const participant = pDoc.exists ? { name: pDoc.data()?.name } : { name: "Unknown" };
        return {
          id: doc.id,
          ...d,
          participant,
          createdAt: toDate(d.createdAt),
        };
      })
    );
    feedback.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
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
    const db = getDb();
    const { id: eventId } = await params;
    const body = await request.json();
    const { participantId, rating, comment } = body;

    if (!participantId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "participantId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const pDoc = await db.collection("participants").doc(participantId).get();
    if (!pDoc.exists || pDoc.data()?.eventId !== eventId) {
      return NextResponse.json(
        { error: "Participant not found for this event" },
        { status: 404 }
      );
    }

    const existing = await db.collection("eventFeedback").where("participantId", "==", participantId).where("eventId", "==", eventId).get();
    const feedbackData = {
      eventId,
      participantId,
      rating,
      comment: comment?.trim() || null,
      createdAt: Timestamp.now(),
      participant: { name: pDoc.data()?.name },
    };

    if (!existing.empty) {
      await existing.docs[0].ref.update({ rating, comment: comment?.trim() || null });
      return NextResponse.json({
        id: existing.docs[0].id,
        ...feedbackData,
        createdAt: toDate(existing.docs[0].data().createdAt),
      });
    }

    const ref = db.collection("eventFeedback").doc();
    await ref.set({
      eventId,
      participantId,
      rating,
      comment: comment?.trim() || null,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      id: ref.id,
      ...feedbackData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
