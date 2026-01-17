import { AnalyticsOverview } from "@/components/professor/analytics-overview";
import { ContentUploader } from "@/components/professor/content-uploader";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ProfessorPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Professor Portal</h2>
                    <p className="text-zinc-400">Manage course content and monitor adaptation efficacy.</p>
                </div>
                <Button variant="outline" className="text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            <AnalyticsOverview />

            <div className="grid gap-8 md:grid-cols-2">
                <ContentUploader />

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Live Class Pulse</h3>
                    {/* Placeholder for real-time list */}
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 bg-white/5 rounded border border-white/5 flex items-center justify-between">
                                <span className="text-sm text-zinc-300">Student {i} switched to Visual Mode</span>
                                <span className="text-xs text-zinc-500">Just now</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
