"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEventTracker } from "@/components/providers/event-tracker";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizOption {
    id: string;
    text: string;
}

interface QuizProps {
    questionId: string;
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    slideFormatJustSeen: string; // "text" | "visual" | "video"
    onComplete?: (wasCorrect: boolean) => void;
}

export function QuizComponent({
    questionId,
    question,
    options,
    correctOptionId,
    slideFormatJustSeen,
    onComplete
}: QuizProps) {
    const { trackEvent } = useEventTracker();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [startTime] = useState(Date.now());

    // Effect to track if they "abandoned" it (unmount without submitting) could go here 
    // but typically handled by parent or session analysis.

    const handleSubmit = () => {
        if (!selectedOption) return;

        const correct = selectedOption === correctOptionId;
        const timeTaken = (Date.now() - startTime) / 1000;
        const currentAttempts = attempts + 1;

        setIsCorrect(correct);
        setIsSubmitted(true);
        setAttempts(currentAttempts);

        trackEvent("knowledge_check_completed", {
            question_id: questionId,
            slide_format_just_seen: slideFormatJustSeen,
            correct: correct,
            user_answer: selectedOption,
            time_to_answer_seconds: timeTaken,
            attempts_before_correct: currentAttempts,
            confidence_level: "somewhat_sure", // Could add UI for this
        });

        if (onComplete) {
            onComplete(correct);
        }

        if (!correct) {
            // Allow retry after delay or immediately?
            // For now, let's keep it simple.
            setTimeout(() => {
                setIsSubmitted(false);
                setSelectedOption(null);
            }, 2000);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto bg-[#1f2937] border-zinc-700">
            <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    Knowledge Check
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-zinc-300 text-lg">{question}</p>

                <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} disabled={isSubmitted && isCorrect}>
                    <div className="space-y-3">
                        {options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-zinc-800 transition-colors border border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10">
                                <RadioGroupItem value={option.id} id={option.id} className="border-zinc-400 text-blue-500" />
                                <Label htmlFor={option.id} className="text-zinc-200 cursor-pointer flex-1">{option.text}</Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>

                <div className="flex items-center justify-between pt-4">
                    {isSubmitted ? (
                        <div className={`flex items-center gap-2 font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                            {isCorrect ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" /> Correct! Great job.
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5" /> Incorrect. Try again...
                                </>
                            )}
                        </div>
                    ) : (
                        <div />
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedOption || (isSubmitted && isCorrect)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitted && !isCorrect ? "Retry" : "Submit Answer"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
