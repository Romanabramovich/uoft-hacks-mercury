import { LearningProfileCard } from "@/components/dashboard/learning-profile-card";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { AdaptationHistory } from "@/components/dashboard/adaptation-history";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const user = await apiClient.getCurrentUser();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back, {user.name.split(" ")[0]}</h2>
                    <p className="text-zinc-400">Here's how Mercury is adapting to your learning style today.</p>
                </div>
                <Link href="/learn/course_calc_101">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                        <PlayCircle className="w-5 h-5 mr-2" />
                        Resume Calculus I
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 lg:col-span-3">
                    <LearningProfileCard user={user} />
                </div>
                <div className="col-span-4">
                    <EngagementChart />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 lg:col-span-7">
                    <AdaptationHistory />
                </div>
            </div>
        </div>
    );
}
