"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { ModeToggle } from "@/components/mode-toggle"; // We'll add this later if needed

export function Header() {
    return (
        <div className="flex items-center p-4 border-b border-white/5 bg-[#111827]/50 backdrop-blur-xl supports-[backdrop-filter]:bg-[#111827]/50">
            {/* Mobile sidebar trigger would go here */}
            <div className="hidden md:flex items-center px-4 py-2 bg-white/5 rounded-full border border-white/10 w-64 text-zinc-400">
                <Search className="w-4 h-4 mr-2" />
                <span className="text-sm">Search courses...</span>
            </div>

            <div className="ml-auto flex items-center gap-x-4">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10">
                    <Bell className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border border-white/20" />
                    <span className="text-sm font-medium text-white hidden md:block">Amy Learner</span>
                </div>
            </div>
        </div>
    );
}
