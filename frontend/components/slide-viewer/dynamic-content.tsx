"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SlideVariant } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Image as ImageIcon, Lightbulb } from "lucide-react";

interface DynamicContentProps {
    variant: SlideVariant;
    title: string;
    onInteraction: (type: string) => void;
}

export function DynamicContent({ variant, title, onInteraction }: DynamicContentProps) {

    const getIcon = () => {
        switch (variant.type) {
            case 'visual': return <ImageIcon className="w-4 h-4 mr-2 text-blue-400" />;
            case 'text': return <ScrollText className="w-4 h-4 mr-2 text-green-400" />;
            case 'example': return <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />;
            default: return null;
        }
    };

    return (
        <div className="max-w-4xl w-full mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{title}</h1>
                <Badge variant="outline" className="border-white/10 text-zinc-400 uppercase tracking-widest text-xs py-1 px-3">
                    {getIcon()}
                    {variant.type} Mode
                </Badge>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={variant.content} // Trigger animation on content change
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-[#1f2937]/50 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-2xl max-h-[600px] overflow-y-auto flex flex-col"
                >
                    <div
                        className="prose dark:prose-invert max-w-none text-lg text-zinc-300 leading-relaxed prose-headings:text-white prose-h2:text-2xl prose-h3:text-xl prose-p:mb-3 prose-li:mb-1"
                        dangerouslySetInnerHTML={{ __html: variant.content }}
                        onClick={() => onInteraction("click")}
                    />
                </motion.div>
            </AnimatePresence>

            <div className="mt-8 text-center" suppressHydrationWarning>
                <p className="text-sm text-zinc-500 animate-pulse">
                    {variant.type === 'visual' && "System detected you learn best with diagrams."}
                    {variant.type === 'text' && "System focusing on definitions based on your profile."}
                    {variant.type === 'example' && "Providing a worked example to reinforce the concept."}
                </p>
            </div>
        </div>
    );
}
