"use client";

import Menubar from "../menubar/menubar";
import { Textarea } from "../ui/textarea";

import { ChangeEvent, useEffect, useState } from "react";

export default function JournalPage() {
  const [content, setContent] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [pendingSave, setPendingSave] = useState<boolean>(false);

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
    } else {
      setPendingSave(true);
    }
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Menubar />
        <div className="w-3/5">
          <h1 className="p-2">{currentDate}</h1>
          <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" placeholder="What's on your mind?"  className="h-[85vh]"/>
        </div>    
      </div> 
    </>
  )
}