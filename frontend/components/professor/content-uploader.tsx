"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

export function ContentUploader() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [complete, setComplete] = useState(false);

    const handleUpload = () => {
        setUploading(true);
        let curr = 0;
        const interval = setInterval(() => {
            curr += 5;
            setProgress(curr);
            if (curr >= 100) {
                clearInterval(interval);
                setUploading(false);
                setComplete(true);
            }
        }, 100);
    };

    return (
        <Card className="bg-[#111827] border-zinc-800 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-500" />
                    Upload Course Content
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Upload your master slide deck (PDF or PPTX). We'll generate the variants.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div
                    className="border-2 border-dashed border-zinc-700 rounded-lg p-12 flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition cursor-pointer bg-white/5"
                    onClick={(!uploading && !complete) ? handleUpload : undefined}
                >
                    {complete ? (
                        <div className="text-center space-y-2">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="font-medium text-white">Upload Complete</p>
                            <p className="text-sm">Generating 12 adaptation variants...</p>
                        </div>
                    ) : uploading ? (
                        <div className="w-full max-w-xs space-y-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-white">
                                <FileText className="w-5 h-5 animate-bounce" />
                                <span className="text-sm">Analying Document Structure...</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-zinc-800" />
                        </div>
                    ) : (
                        <>
                            <Upload className="w-10 h-10 mb-4" />
                            <p className="font-medium mb-1">Drag & Drop or Click to Upload</p>
                            <p className="text-xs">Supports .pptx, .pdf, .md</p>
                        </>
                    )}
                </div>

                {complete && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-md">
                        <h4 className="font-medium text-purple-400 mb-2 text-sm">AI Processing Status</h4>
                        <ul className="space-y-2 text-xs text-zinc-300">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                Extracted 42 slides
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                Generated text-only summaries
                            </li>
                            <li className="flex items-center gap-2">
                                <LoaderIcon className="w-3 h-3 text-yellow-500 animate-spin" />
                                Creating visual diagrams (Estimating 2 mins remaining)
                            </li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
