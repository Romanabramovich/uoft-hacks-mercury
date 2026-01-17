import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19] text-white p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
            Education that adapt's to <span className="text-indigo-400">you</span>.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Mercury flips the classroom UI in real-time. Visual learners see diagrams, text learners see summaries.
            Stop fighting the format.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200">
              Start Learning
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-gray-700 hover:bg-gray-800 text-white">
            For Professors
          </Button>
        </div>
      </div>
    </div>
  );
}
