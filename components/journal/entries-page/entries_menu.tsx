"use client";
import { get_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react"
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import useSWR from "swr";

interface EntriesPageProps {
  user: User | null
  dbDate: string
  on_close: () => void
  on_entry_select: (entry: JournalEntry) => void
}

// new entries menu
// create a grid like view with option for compressed
// data is just pulled downwards
// arrow keys can be used to navigate
// as can scrolling
// when scroll exceeds bounds next gets loaded

export default function EntriesPage({user, dbDate, on_close, on_entry_select}: EntriesPageProps) {
  // array of journal entries to show the user
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);


  useEffect(() => {
    // event listeners for keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          break;
        case "ArrowDown":
          event.preventDefault();
          break;
        case "Escape":
          event.preventDefault();
          on_close();
          break;
        case "Enter":
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  })

  // index for the viewable entries
  const fetched = useEntries(user, dbDate);
   
  if (!fetched) return null;
  const data = fetched.data;
  if (!data) return null;
  const entries = data.entries;
  
  return (
    <>
      <div className="fixed top-0 min-h-screen w-full flex justify-center items-center z-20">
        <div className="bg-black w-1/3 h-[20vh] z-40 p-2">
          <div className="flex justify-between">
            <h1 className="font-bold">Entries</h1>
            <Button variant="ghost" size="icon" className="size-8" onClick={on_close}><X /></Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {entries.map((entry: JournalEntry, i: number) => {
              return (
                <div key={i} className={`flex flex-col items-center p-2 ${ i === activeIndex ? "bg-orange-400 text-black" : ""}`}>
                  <File size={32} />
                  <p>
                    {entry.created}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="absolute w-full h-full bg-black/50 z-30" onMouseDown={on_close}></div>
      </div>
    </>
  )
}

function useEntries(user: User | null, dbDate: string) {
  if (!user) {
    console.log("null user")
    return null;
  }

  const { data, error, isLoading } = useSWR([user, dbDate], ([user, dbDate]) => get_entries(user, dbDate), {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return { data: data, error, isLoading };
}