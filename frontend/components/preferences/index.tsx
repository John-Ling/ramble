"use client";

import ProtectedRoute from "../providers/protected_route";
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";
import FileUpload from "./file_upload";
import { useUser } from "@/hooks/useUser";

export default function PreferencesPage() {
  const user  = useUser();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-[#101010] w-full lg:w-3/5 flex justify-between">
          {/* Sidebar */}
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

          {/* Content */}
          <div className="p-5 m-5 mr-3 h-[85vh] w-full lg:w-4/5  bg-[#141414]  rounded-sm overflow-y-scroll">
            <div className="h-full flex">
              <h1>Content</h1>
            </div>

            {/* File upload */}
            <div className="h-full flex flex-col items-center justify-center">
              <FileUpload uid={user?.id}/>
            </div>

            {/* Privacy settings */}
            <div className="h-full flex ">
              <h1>Content</h1>
            </div>

            {/* Templates */}
            <div className="h-full flex">
              <h1>Content</h1>
            </div>


            {/* Language  */}
            <div className="h-full flex">
              <h1>Content</h1>
            </div>

            {/* Colour Theme  */}
            <div className="h-full flex">
              <h1 className="text-3xl font-bold">Theme</h1>
              
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}