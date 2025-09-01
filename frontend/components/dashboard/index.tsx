"use client";

import ProtectedRoute from "../providers/protected_route";
import EmotionPlot from "./emotion-plot/emotion_plot";


import { Button } from "../ui/button";
import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <div className="bg-background border-2  p-5 rounded-lg w-full h-[85vh] lg:w-4/5 flex flex-col">
              <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Button variant="secondary" onClick={() => router.push("/journal")} className="text-foreground" size="sm"><Undo2 /> Return</Button>
              </div>
              <div className="mt-10">
                <EmotionPlot />
              </div>
          </div>
        </div>
      </ProtectedRoute>
    </>
  )
}