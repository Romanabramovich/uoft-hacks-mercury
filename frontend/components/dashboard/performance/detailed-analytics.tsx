"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

const performanceData = [
    { week: 'Week 1', visual: 65, text: 40, overall: 55 },
    { week: 'Week 2', visual: 72, text: 45, overall: 60 },
    { week: 'Week 3', visual: 78, text: 48, overall: 68 },
    { week: 'Week 4', visual: 85, text: 52, overall: 75 },
    { week: 'Week 5', visual: 88, text: 60, overall: 80 },
    { week: 'Week 6', visual: 92, text: 70, overall: 85 },
];

const subjectData = [
    { subject: 'Math', mastery: 85 },
    { subject: 'Physics', mastery: 72 },
    { subject: 'History', mastery: 90 },
    { subject: 'Comp Sci', mastery: 65 },
];

export function DetailedAnalytics() {
    return (
        <div className="space-y-6">
            <Card className="bg-[#1f2937]/50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Comprehension Trends</CardTitle>
                    <CardDescription className="text-zinc-400">Your improvement over the semester as Mercury adapts to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="week" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", color: "#f3f4f6" }}
                                    itemStyle={{ color: "#f3f4f6" }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="visual" stroke="#8884d8" name="Visual Mode" />
                                <Line type="monotone" dataKey="text" stroke="#82ca9d" name="Text Mode" />
                                <Line type="monotone" dataKey="overall" stroke="#ff7300" strokeWidth={2} name="Overall Mastery" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-[#1f2937]/50 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>Mastery by Subject</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                    <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                                    <YAxis dataKey="subject" type="category" stroke="#9ca3af" width={80} />
                                    <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                                    <Bar dataKey="mastery" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1f2937]/50 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-400 font-medium">Top Performer</p>
                            <p className="text-xs text-zinc-400 mt-1">You are in the top 10% of Visual Learners in Calculus I.</p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-400 font-medium">Focus Area</p>
                            <p className="text-xs text-zinc-400 mt-1">Your attention drops after 25 mins. Try taking breaks using the Pomodoro timer.</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-blue-400 font-medium">Adaptation Win</p>
                            <p className="text-xs text-zinc-400 mt-1">Switching to "Example-First" boosted your Physics comprehension by 22%.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
