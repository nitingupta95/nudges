import { NextResponse } from 'next/server';
import { EventService } from '@/app/services/events/event.service';

export async function POST(request: Request) {
    try {
        const eventData = await request.json();
        const event = await EventService.trackEvent(eventData);
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}