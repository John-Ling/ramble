"use client";

import ProtectedRoute from "../providers/protected_route";
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";

export default function PreferencesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-[#101010] w-3/5 flex justify-between">
          <div className="p-5 m-5 h-[85vh] w-full lg:w-1/5  bg-[#141414] rounded-sm">
          <h1 className="font-bold text-2xl">Settings</h1>
          <div className="flex flex-col w-full gap-y-5">
            <h2 className="mt-5 font-bold">General</h2>
            <Separator />
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Account Information</Button>
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Upload Entries</Button>
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Privacy</Button>
            <h2 className="mt-5 font-bold">UI</h2>
            <Separator />
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Templates</Button>
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Language</Button>
            <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Colour Theme</Button>
          </div>
        </div>
        <div className="p-5 m-5 mr-3 h-[85vh] w-full lg:w-4/5  bg-[#141414]  rounded-sm">
          <h1>Hello</h1>
        </div>
        </div>
        
      </div>
      
    </ProtectedRoute>
  )
}