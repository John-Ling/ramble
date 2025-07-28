"use client";
import { get_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react"
import { ReceiptRussianRubleIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import useSWR from "swr";

interface EntriesPageProps {
  user: User | null;
  dbDate: string;
  fetchCount: number;
  set_fetch_count: () => void;
  on_close: () => void;
  on_entry_select: (entry: JournalEntry) => void;
}

// new entries menu
// create a grid like view with option for compressed
// data is just pulled downwards
// arrow keys can be used to navigate
// as can scrolling
// when scroll exceeds bounds next gets loaded

export default function EntriesPage({user, dbDate, fetchCount, set_fetch_count, on_close, on_entry_select}: EntriesPageProps) {
  // array of journal entries to show the user
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const entryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // event listeners for keyboard navigation
    const on_key_down = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (activeIndex <= 2) break;

          setActiveIndex(prev => Math.max(0, prev - 4) );
          break;
        case "ArrowDown":
          event.preventDefault();
          console.log("Down");
          console.log(activeIndex);
          if (activeIndex >= entries.length - 4 || activeIndex + 4 >= entries.length) {
            break;
          }
          setActiveIndex(prev => prev + 4);
          break;
        case "ArrowLeft":
          console.log("LEft");
          event.preventDefault();
          setActiveIndex(Math.max(0, activeIndex - 1) );
          break;
        case "ArrowRight":
          console.log("Right");
          event.preventDefault();
    
          if (activeIndex + 1 >= entries.length) {
            break;
          }
          setActiveIndex(prev => prev + 1);
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

    document.addEventListener('keydown', on_key_down);

    return () => {
      document.removeEventListener('keydown', on_key_down);
    };
  });

  useEffect(() => {
    // scroll event listeners
    const on_scroll = (event: Event) => {
      if (!entryMenuRef.current) return;

      if (Math.ceil(entryMenuRef.current.scrollHeight - entryMenuRef.current.scrollTop) === entryMenuRef.current.clientHeight) {
        console.log("Reached bottom");
        set_fetch_count();
      }

      return;
    }
    entryMenuRef.current?.addEventListener("scroll", on_scroll);

    return () => {
      entryMenuRef.current?.removeEventListener("scroll", on_scroll);
    }
  });

  // index for the viewable entries
  const fetched = useEntries(user, dbDate, fetchCount);
   
  if (!fetched) return null;
  const data = fetched.data;
  if (!data) return null;
  const entries = data.entries;

  return (
    <>
      <div className="fixed top-0 min-h-screen w-full flex justify-center items-center z-20">
        <div className="bg-[#101010] w-4/5 lg:1/2 xl:w-1/3  h-[50vh]  lg:h-[35vh] z-40 flex flex-col overflow-scroll rounded-sm" ref={entryMenuRef}>
          <div className="flex justify-between sticky top-0 bg-[#141414] border-b-1 p-4">
            <h1 className="font-bold text-2xl">Entries</h1>
            <Button variant="ghost" size="icon" className="size-8" onClick={on_close}><X /></Button>
          </div>
          { fetched.isLoading ? <p>Loading...</p> : <div className="flex justify-center items-center">
            <div className="grid grid-cols-2  md:grid-cols-4 lg:gap-12 mt-10">
              {entries.map((entry: JournalEntry, i: number) => {
                return (
                  <div key={i} onClick={() => alert("Clicked")} className={`flex flex-col items-center p-2 rounded-sm ${ i === activeIndex ? "bg-orange-400 text-black" : ""}`}>
                    <File size={32} />
                    <p className="text-xs">
                      {entry.created}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>}
        </div>
        <div className="absolute w-full h-full bg-black/50 z-30" onMouseDown={on_close}></div>
      </div>
    </>
  )
}

function useEntries(user: User | null, dbDate: string, fetchCount: number) {
  if (!user) {
    console.log("null user")
    return null;
  }

  const { data, error, isLoading } = useSWR([user, dbDate, fetchCount], ([user, dbDate, fetchCount]) => get_entries(user, dbDate, fetchCount), {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return { data: data, error, isLoading };
}