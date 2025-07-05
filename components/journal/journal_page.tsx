"use client";

import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import SettingsMenu from "../settings-menu/settings_menu";

import { google_sign_out } from "@/lib/firebase/auth";

export default function JournalPage() {
  const [content, setContent] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [pendingSave, setPendingSave] = useState<boolean>(false);
  const [entriesVisible, setEntriesVisible] = useState<boolean>(false);

  const currentDate: string = new Date().toLocaleDateString();

  useEffect(() => {
    // attach event listener for autosave
    const interval = setInterval(autosave, 1000);
    return (() => {
      clearInterval(interval);
    })
  })

  function autosave() {
    if (content !== saved && pendingSave) {
      // run save code
      setSaved(content);
      setPendingSave(false);
      return;
    } 
    setPendingSave(true);
    return;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        {/* menubar */}
        <div className="flex w-full justify-center">
          <div className="flex w-full lg:w-3/4 justify-between">
            <h1 className="font-bold text-2xl">Ramble</h1>
            <SettingsMenu onEntries={() => setEntriesVisible(true)} onLogout={google_sign_out}/>
          </div>
        </div>

        {/* journal form */}
        <div className="w-full lg:w-3/5">
          <h1 className="p-2">{currentDate}</h1>
          <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" placeholder="What's on your mind?"  className="h-[85vh]"/>
        </div>    
      </div> 
    </>
  )
}