"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

const adaptations = [
    {
        id: 1,
        course: "Calculus I",
        timestamp: "2 mins ago",
        from: "Text Heavy",
        to: "Visual Diagram",
        reason: "Dwell time > 45s",
        result: "Success"
    },
    {
        id: 2,
        course: "Physics 101",
        timestamp: "1 hour ago",
        from: "Abstract Theory",
        to: "Worked Example",
        reason: "Quiz failure detected",
        result: "Success"
    },
    {
        id: 3,
        course: "History of Art",
        timestamp: "Yesterday",
        from: "Video Lecture",
        to: "Transcript Summary",
        reason: "Fast scrolling detected",
        result: "Success"
    }
];

export function AdaptationHistory() {
    return (
        <Card className="h-full border-zinc-800 bg-[#111827] text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    Recent Adaptations
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    How LearnID adapted content for you recently.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {adaptations.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-400">{item.timestamp} • {item.course}</span>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-zinc-400">{item.from}</span>
                                <ArrowRight className="w-3 h-3 text-zinc-500" />
                                <span className="text-blue-400">{item.to}</span>
                            </div>
                            <span className="text-xs text-zinc-500 italic">Trigger: {item.reason}</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {item.result}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
