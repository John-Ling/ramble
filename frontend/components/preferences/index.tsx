"use client";

import ProtectedRoute from "../providers/protected_route";
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";
import { Upload, FileText } from "lucide-react";

export default function PreferencesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-[#101010] w-full lg:w-3/5 flex justify-between">
          {/* sidebar */}
          <div className="hidden lg:block p-5 m-5 h-[85vh] w-full lg:w-1/5  bg-[#141414] rounded-sm">
            <div className="flex flex-col w-full ">
              <h1 className="font-bold text-2xl">Settings</h1>
              <h2 className="mt-5 font-bold">General</h2>
              <Separator className="my-2"/>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Account Information</Button>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Upload Entries</Button>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Privacy</Button>
              <h2 className="mt-5 font-bold">UI</h2>
              <Separator className="my-2"/>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Templates</Button>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Language</Button>
              <Button variant="ghost" className="justify-start text-md pb-6 pt-6">Colour Theme</Button>
            </div>
          </div>

          {/* content */}
          <div className="p-5 m-5 mr-3 h-[85vh] w-full lg:w-4/5  bg-[#141414]  rounded-sm overflow-y-scroll">
            <div className="h-full flex">
              <h1>Content</h1>
            </div>
            <div className="h-full flex flex-col items-center justify-center">
              <h3 className="font-bold text-2xl text-center mb-5">Upload Entries</h3>
              <div className="bg-[#111111] h-[30vh] w-1/2 flex flex-col justify-center items-center">
                  <div className="flex justify-center items-center flex-col">
                    <FileText className="size-16"/>
                    <p className="mb-5 text-lg">Drag and Drop Files</p>
                  </div>
                  
                  <label className="flex justify-center flex-col items-center">
                    <Upload className="text-center"/> 
                    <input id="file-upload" className="hidden p-5" type="file" />
                  </label>
                  <div className="pointer-events-none">
                    or upload from your computer
                  </div>
              </div>
            </div>
            <div className="h-full flex ">
              <h1>Content</h1>
            </div>
            <div className="h-full flex">
              <h1>Content</h1>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}