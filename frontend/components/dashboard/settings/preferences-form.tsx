"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export function PreferencesForm() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-[#1f2937]/50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Accessibility & Interface</CardTitle>
                    <CardDescription className="text-zinc-400">Customize how Mercury presents content to you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">High Contrast Mode</Label>
                            <p className="text-sm text-zinc-400">Increase contrast for better readability.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Dyslexia Friendly Font</Label>
                            <p className="text-sm text-zinc-400">Use OpenDyslexic or similar fonts.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="space-y-2">
                        <Label>Default Text Size</Label>
                        <Select defaultValue="medium">
                            <SelectTrigger className="bg-[#111827] border-white/10 text-white">
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="xl">Extra Large</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#1f2937]/50 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Learning Preferences</CardTitle>
                    <CardDescription className="text-zinc-400">Fine-tune the AI's adaptation logic.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Auto-Adapt Content</Label>
                            <p className="text-sm text-zinc-400">Allow Mercury to switch formats automatically.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Show Confidence Score</Label>
                            <p className="text-sm text-zinc-400">Display how sure the AI is about your profile.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                        <Label>Preferred Learning Pace</Label>
                        <Select defaultValue="moderate">
                            <SelectTrigger className="bg-[#111827] border-white/10 text-white">
                                <SelectValue placeholder="Select pace" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="slow">Slow & Deliberate</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="fast">Fast / Skimming</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-2 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
