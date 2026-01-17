"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";

export function AnalyticsOverview() {
    return (
        <div className="grid gap-2 md:grid-cols-3">
            <Card className="bg-[#111827] border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">142</div>
                    <p className="text-xs text-muted-foreground">+12% from last week</p>
                </CardContent>
            </Card>
            <Card className="bg-[#111827] border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Comprehension</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">89%</div>
                    <p className="text-xs text-muted-foreground">+24% after adaptation</p>
                </CardContent>
            </Card>
            <Card className="bg-[#111827] border-zinc-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Needs intervention</p>
                </CardContent>
            </Card>
        </div>
    );
}
