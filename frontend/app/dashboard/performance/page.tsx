import { DetailedAnalytics } from "@/components/dashboard/performance/detailed-analytics";

export default function PerformancePage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Performance Analytics</h2>
                <p className="text-zinc-400">Deep dive into your learning metrics.</p>
            </div>
            <DetailedAnalytics />
        </div>
    );
}
