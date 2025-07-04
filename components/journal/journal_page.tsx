"use client";
import Menubar from "../menubar/menubar";
import { Textarea } from "../ui/textarea";


export default function JournalPage() {
  const currentDate: string = new Date().toLocaleDateString();

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Menubar />
        <div className="w-3/5">
          <h1 className="p-2">{currentDate}</h1>
          <Textarea autoCorrect="false" placeholder="What's on your mind?"  className="h-[85vh]"/>
        </div>    
      </div> 
    </>
  )
}