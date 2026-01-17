"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventTracker } from '@/hooks/analytics/useEventTracker';
import { useSlideTracking } from '@/hooks/analytics/useSlideTracking';
import { useInteractionTracking } from '@/hooks/analytics/useInteractionTracking';
import { useQuizTracking } from '@/hooks/analytics/useQuizTracking';
import { useConfusionDetection } from '@/hooks/analytics/useConfusionDetection';
import { useState } from 'react';

// Wrapper for slide tracking test
function SlideTrackerTest() {
    // Simulating slide ID "test-slide-1"
    const { logVideoPause, logDiagramZoom, logNavigation } = useSlideTracking("test-slide-1", "video");

    return (
        <div className="space-y-2 border p-4 rounded-md">
            <h3 className="font-bold">Slide Tracking (Mounts on load)</h3>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={logVideoPause}>Log Video Pause</Button>
                <Button size="sm" variant="outline" onClick={logDiagramZoom}>Log Diagram Zoom</Button>
                <Button size="sm" variant="outline" onClick={() => logNavigation('back')}>Log Back Nav</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                * Event "slide_viewed" will fire when you leave this page or component unmounts.
            </p>
        </div>
    );
}

function InteractionTest() {
    const { handleInteractionStart, handleInteractionEnd } = useInteractionTracking("clicked_example", "code_snippet");

    return (
        <div className="space-y-2 border p-4 rounded-md">
            <h3 className="font-bold">Interaction Tracking</h3>
            <Button
                onMouseDown={handleInteractionStart}
                onMouseUp={() => handleInteractionEnd(true)}
                className="bg-blue-600 hover:bg-blue-700"
            >
                Click & Hold Me (Simulate Interaction)
            </Button>
        </div>
    );
}

function QuizTest() {
    const { submitQuizResult, logAttempt } = useQuizTracking("q-123", "text-heavy");

    return (
        <div className="space-y-2 border p-4 rounded-md">
            <h3 className="font-bold">Quiz Tracking</h3>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={logAttempt}>Log Attempt</Button>
                <Button size="sm" onClick={() => submitQuizResult("Answer A", true, "confident")}>
                    Submit Correct Answer
                </Button>
            </div>
        </div>
    );
}

function ConfusionTest() {
    const { logNavigation, reportConfusion } = useConfusionDetection();
    const [clicks, setClicks] = useState(0);

    const spamNavigation = () => {
        setClicks(c => c + 1);
        logNavigation(`slide-${clicks}`);
    };

    return (
        <div className="space-y-2 border p-4 rounded-md">
            <h3 className="font-bold">Confusion Detection</h3>
            <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={spamNavigation}>
                    Spam Nav ({clicks})
                </Button>
                <Button size="sm" variant="secondary" onClick={() => reportConfusion("current-slide")}>
                    Report "I'm Confused"
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                * Click "Spam Nav" &gt;5 times in 30s to trigger confusion event.
            </p>
        </div>
    );
}

export default function AnalyticsTestPage() {
    const { sessionId, userId } = useEventTracker();

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Analytics Verification Dashboard</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Session Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        <div>
                            <span className="text-muted-foreground">User ID:</span>
                            <div className="bg-muted p-2 rounded mt-1">{userId || 'Loading...'}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Session ID:</span>
                            <div className="bg-muted p-2 rounded mt-1">{sessionId || 'Loading...'}</div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-yellow-500">
                        ⚠ Open Developer Console (F12) to see Real-Time Logs
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <SlideTrackerTest />
                <InteractionTest />
                <QuizTest />
                <ConfusionTest />
            </div>
        </div>
    );
}
