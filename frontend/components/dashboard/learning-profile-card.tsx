"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Zap, Eye, BookOpen } from "lucide-react";
import { User } from "@/lib/api/types";

interface LearningProfileCardProps {
    user: User;
}

export function LearningProfileCard({ user }: LearningProfileCardProps) {
    const profile = user.profile;

    if (!profile) return null;

    return (
        <Card className="h-full border-zinc-800 bg-[#111827] text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="w-6 h-6 text-purple-500" />
                    Learning Identity
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    AI-generated analysis of your cognitive patterns
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Optimal Format</span>
                        <Badge variant="outline" className="border-purple-500 text-purple-400 capitalize">
                            {profile.optimalFormat}
                        </Badge>
                    </div>
                    <Progress value={85} className="h-2 bg-zinc-800" />
                    <p className="text-xs text-zinc-500 text-right">85% Match Rate</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            Pace
                        </div>
                        <div className="text-lg font-semibold capitalize">{profile.pace}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            Processing
                        </div>
                        <div className="text-lg font-semibold capitalize">{profile.processingStyle.replace("_", " ")}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs uppercase tracking-wider">
                            <Eye className="w-3 h-3" />
                            Attention
                        </div>
                        <div className="text-lg font-semibold">{profile.attentionSpanMinutes} mins</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 text-xs uppercase tracking-wider">
                            <BookOpen className="w-3 h-3" />
                            Best Learning Time
                        </div>
                        <div className="text-lg font-semibold capitalize">{profile.bestTimeOfDay}</div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Profile Confidence</span>
                        <span className="text-sm font-bold text-green-400">{(profile.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={profile.confidenceScore * 100} className="h-1.5 bg-zinc-800" />
                </div>
            </CardContent>
        </Card>
    );
}
