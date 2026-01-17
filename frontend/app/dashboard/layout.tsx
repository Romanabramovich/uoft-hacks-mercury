"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { EventTrackerProvider } from "@/components/providers/event-tracker";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <EventTrackerProvider>
                <div className="flex h-screen bg-[#0b0f19]">
                    <div className="w-64 hidden md:block fixed inset-y-0 z-50">
                        <Sidebar />
                    </div>
                    <div className="md:pl-64 flex flex-col flex-1 w-full">
                        <Header />
                        <main className="flex-1 overflow-auto p-8">
                            {children}
                        </main>
                    </div>
                </div>
            </EventTrackerProvider>
        </ThemeProvider>
    );
}
