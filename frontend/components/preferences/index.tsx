"use client";

import ProtectedRoute from "../providers/protected_route";

export default function PreferencesPage() {
  return (
    <ProtectedRoute>
      <div className="p-5">
        <div className="left-32 h-[96vh] max-w-[20vw] flex bg-[#141414]">
          <h1>Hello</h1>
        </div>
      </div>
      
    </ProtectedRoute>
  )
}