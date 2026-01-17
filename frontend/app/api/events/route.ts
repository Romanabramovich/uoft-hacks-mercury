import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const events = await request.json();

        // For hackathon: Log to console
        console.log('------------------------------------------------');
        console.log(`[API] Received batch of ${events.length} events`);
        events.forEach((e: any) => {
            console.log(`[${e.timestamp}] ${e.event}:`, JSON.stringify(e.properties, null, 2));
        });
        console.log('------------------------------------------------');

        // TODO: Connect to DB here

        return NextResponse.json({ status: 'success', count: events.length });
    } catch (error) {
        console.error("Error processing events:", error);
        return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
    }
}
