"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { time: "10:00", text: 40, visual: 65, active: 45 },
    { time: "10:05", text: 30, visual: 75, active: 55 },
    { time: "10:10", text: 45, visual: 85, active: 65 },
    { time: "10:15", text: 50, visual: 80, active: 75 },
    { time: "10:20", text: 35, visual: 90, active: 85 },
    { time: "10:25", text: 60, visual: 70, active: 65 },
    { time: "10:30", text: 65, visual: 60, active: 55 },
];

export function EngagementChart() {
    return (
        <Card className="h-full border-zinc-800 bg-[#111827] text-white">
            <CardHeader>
                <CardTitle>Comprehension by Format</CardTitle>
                <CardDescription className="text-zinc-400">
                    Your performance across different content modalities.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorVisual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorText" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                                itemStyle={{ color: "#e5e7eb" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="visual"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorVisual)"
                                name="Visual Comprehension"
                            />
                            <Area
                                type="monotone"
                                dataKey="text"
                                stroke="#82ca9d"
                                fillOpacity={1}
                                fill="url(#colorText)"
                                name="Text Comprehension"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
