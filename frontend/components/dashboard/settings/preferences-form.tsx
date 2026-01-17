"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { UserPreferences } from "@/lib/api/types";

export function PreferencesForm() {
    const { preferences, isLoading: isSettingsLoading, updatePreferences, resetPreferences } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleToggle = (key: keyof UserPreferences, value: any) => {
        updatePreferences({ [key]: value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Force sync update/save feel
        await updatePreferences(preferences);

        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const confirmReset = async () => {
        setShowResetConfirm(false);
        await resetPreferences();
    };

    if (isSettingsLoading) {
        return <div className="p-8 flex justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 relative">
            {/* Confirmation Modal Overlay */}
            {showResetConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                    <Card className="w-[90%] max-w-md bg-[#1f2937] border-red-500/30 text-white shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-red-400">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Reset all settings?
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                This will revert all preferences to their default values. This action cannot be undone.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowResetConfirm(false)} className="hover:bg-white/10 text-white">Cancel</Button>
                            <Button onClick={confirmReset} className="bg-red-600 hover:bg-red-700 text-white">Yes, Reset Defaults</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-[#1f2937]/50 border-white/10 text-white backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl text-indigo-100">Accessibility & Interface</CardTitle>
                    <CardDescription className="text-zinc-400">Customize how Mercury presents content to you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                            <Label className="text-base group-hover:text-indigo-300 transition-colors">Light Mode</Label>
                            <p className="text-sm text-zinc-400">Switch to light theme appearance.</p>
                        </div>
                        <Switch
                            checked={preferences.lightMode}
                            onCheckedChange={(c) => handleToggle('lightMode', c)}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                    <div className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                            <Label className="text-base group-hover:text-indigo-300 transition-colors">Dyslexia Friendly Font</Label>
                            <p className="text-sm text-zinc-400">Use OpenDyslexic or similar fonts.</p>
                        </div>
                        <Switch
                            checked={preferences.dyslexicFont}
                            onCheckedChange={(c) => handleToggle('dyslexicFont', c)}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                    <div className="space-y-2 group">
                        <Label className="group-hover:text-indigo-300 transition-colors">Default Text Size</Label>
                        <Select value={preferences.textSize} onValueChange={(v) => handleToggle('textSize', v)}>
                            <SelectTrigger className="bg-[#111827] border-white/10 text-white focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1f2937] border-white/10 text-white">
                                <SelectItem value="small">Small (14px)</SelectItem>
                                <SelectItem value="medium">Medium (16px)</SelectItem>
                                <SelectItem value="large">Large (18px)</SelectItem>
                                <SelectItem value="xl">Extra Large (20px)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#1f2937]/50 border-white/10 text-white backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl text-indigo-100">Learning Preferences</CardTitle>
                    <CardDescription className="text-zinc-400">Fine-tune the AI's adaptation logic.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                            <Label className="text-base group-hover:text-indigo-300 transition-colors">Auto-Adapt Content</Label>
                            <p className="text-sm text-zinc-400">Allow LearnID to switch formats automatically.</p>
                        </div>
                        <Switch
                            checked={preferences.autoAdapt}
                            onCheckedChange={(c) => handleToggle('autoAdapt', c)}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                    <div className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                            <Label className="text-base group-hover:text-indigo-300 transition-colors">Show Confidence Score</Label>
                            <p className="text-sm text-zinc-400">Display how sure the AI is about your profile.</p>
                        </div>
                        <Switch
                            checked={preferences.showConfidence}
                            onCheckedChange={(c) => handleToggle('showConfidence', c)}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                    <div className="space-y-2 group">
                        <Label className="group-hover:text-indigo-300 transition-colors">Preferred Learning Pace</Label>
                        <Select value={preferences.pace} onValueChange={(v) => handleToggle('pace', v)}>
                            <SelectTrigger className="bg-[#111827] border-white/10 text-white focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                                <SelectValue placeholder="Select pace" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1f2937] border-white/10 text-white">
                                <SelectItem value="slow">Slow & Deliberate</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="fast">Fast / Skimming</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
                <Button
                    variant="ghost"
                    onClick={() => setShowResetConfirm(true)}
                    className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`
                        min-w-[140px] transition-all duration-300 
                        ${isSaved
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-500/50 shadow-green-900/20"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        }
                    `}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : isSaved ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
