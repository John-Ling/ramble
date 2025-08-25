"use client";

import ProtectedRoute from "../providers/protected_route";
export default function DashboardPage() {
  return (
    <>
      <ProtectedRoute>
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-card p-5 rounded-lg w-full h-[80vh] lg:w-4/5 flex justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
      </div>
    </ProtectedRoute>
    </>
  )
}