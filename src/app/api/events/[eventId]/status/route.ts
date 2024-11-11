import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventDoc = await adminDb
      .collection('events')
      .doc(params.eventId)
      .get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    return NextResponse.json(eventData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch event status' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { status } = await request.json();
    await adminDb
      .collection('events')
      .doc(params.eventId)
      .update({ status });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
} 