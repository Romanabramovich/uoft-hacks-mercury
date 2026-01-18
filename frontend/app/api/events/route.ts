import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

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

        // Connect to MongoDB and save events (try-catch to prevent failure if DB is unreachable)
        try {
            const db = await getDatabase();
            const eventsCollection = db.collection('events');

            // Add server timestamp to each event
            const eventsWithServerTimestamp = events.map((event: any) => ({
                ...event,
                serverTimestamp: new Date(),
            }));

            // Insert events into MongoDB
            const result = await eventsCollection.insertMany(eventsWithServerTimestamp);
            console.log(`[MongoDB] Successfully inserted ${result.insertedCount} events`);
        } catch (dbError) {
            console.warn("[MongoDB] Connection failed or insert failed. Events logged to console only.", dbError);
            // We swallow the error here so the frontend tracker considers it a success and doesn't retry/error
        }

        return NextResponse.json({
            status: 'success',
            count: events.length,
            message: "Events processed (DB persistence optional)"
        });
    } catch (error) {
        console.error("Error processing events:", error);
        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Invalid payload'
        }, { status: 400 });
    }
}
