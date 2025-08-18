"use client";
import { useEffect, useRef, useState, useCallback } from "react"
import { X, FileText, ChevronsLeftRightEllipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";


interface ResponseData {
  entries: JournalEntryReference[];
  finalEntry?:  JournalEntryReference;
  entryCount: number;
  areDocumentsLeft: boolean;
}

interface EntriesPageProps {
  uid: string | undefined;
  dbDate: string;
  fetchCount: number;
  set_fetch_count: () => void;
  on_close: () => void;
  on_entry_select: (entry: JournalEntryReference) => void;
}

export default function EntriesPage({uid, dbDate, fetchCount, set_fetch_count, on_close, on_entry_select}: EntriesPageProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const entryMenuRef = useRef<HTMLDivElement>(null);
  const finalEntryRef = useRef<JournalEntryReference | null>(null);
  const areDocumentsLeftRef = useRef<boolean>(false);

  let data: ResponseData | undefined = undefined;
  let entries: JournalEntryReference[] = [];


  useEffect(() => {
    // event listeners for keyboard navigation
    const on_key_down = (event: KeyboardEvent) => {
      if (!entries) return;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (activeIndex <= 2) break;

          setActiveIndex(prev => Math.max(0, prev - 4) );
          break;
        case "ArrowDown":
          event.preventDefault();
          if (activeIndex >= entries.length - 4 || activeIndex + 4 >= entries.length) break;
          setActiveIndex(prev => prev + 4);
          break;
        case "ArrowLeft":
          event.preventDefault();
          setActiveIndex(Math.max(0, activeIndex - 1) );
          break;
        case "ArrowRight":
          event.preventDefault();
          if (activeIndex + 1 >= entries.length) break;
          setActiveIndex(prev => prev + 1);
          break;
        case "Escape":
          event.preventDefault();
          on_close();
          break;
        case "Enter":
          event.preventDefault();
          selectEntry(activeIndex);
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

  function selectEntry(index: number) {
    const entry: JournalEntryReference | undefined = entries[activeIndex];
    if (entry) {
      on_entry_select(entry);
    }
  }

  const on_scroll = useCallback(() => {
    if (!entryMenuRef.current)  {
      console.log("REF NULL");
      return;
    };

    const SCROLL_THRESHOLD = 5; // pixels
    if (Math.abs(entryMenuRef.current.scrollHeight - entryMenuRef.current.scrollTop) - entryMenuRef.current.clientHeight <= SCROLL_THRESHOLD) {
      if (areDocumentsLeftRef.current === true) {
        set_fetch_count();
      }
    }
    return;
  }, [areDocumentsLeftRef, set_fetch_count, entryMenuRef]);
    
  useEffect(() => {
    entryMenuRef.current?.addEventListener("scroll", on_scroll);

    return () => {
      entryMenuRef.current?.removeEventListener("scroll", on_scroll);
    }
  }, [on_scroll]);

  const fetched = useEntries(uid, dbDate, fetchCount); 
  if (!fetched) {
    console.log("Fetched is null");
    return null;
  };
  data = fetched?.data;
  console.log("DATA ", data);
  entries = data?.entries;
  areDocumentsLeftRef.current = data ? data.areDocumentsLeft : false;

  return (
    <>
      <div className="bg-[#101010] w-4/5 lg:1/2 xl:w-1/3  h-[50vh]  lg:h-[35vh] z-40 flex flex-col overflow-scroll rounded-sm" ref={entryMenuRef}>
        <div className="flex justify-between sticky top-0 bg-[#141414] border-b-1 p-4">
          <h1 className="font-bold text-2xl">Entries</h1>
          <Button variant="ghost" size="icon" className="size-8" onClick={on_close}><X /></Button>
        </div>
        { fetched.isLoading ? <p>Loading...</p> : 
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-2  md:grid-cols-4 lg:gap-16 mt-10 p-2">
            {entries?.map((entry: JournalEntryReference, i: number) => {
              return (
                <div key={i} onClick={() => selectEntry(i)} onMouseOver={() => setActiveIndex(i)}  className={`hover:cursor-pointer flex flex-col items-center p-2 rounded-sm ${ i === activeIndex ? "bg-orange-400 text-black" : ""}`}>
                  <FileText size={48} />
                  <p className="text-sm">
                    {entry._id}
                  </p>
                </div>
              )
            })}
          </div>
        </div>}
      </div>
      <div className="absolute w-full h-full bg-black/50 z-30" onMouseDown={on_close}></div>
    </>
  )
}

function useEntries(uid: string | undefined, dbDate: string, fetchCount: number) {
  if (!uid) {
    return null;
  }

  console.log("GETTING ENTRIES");
  const fetcher = (url: string) => fetch(url).then(r => r.json());

  // use mutate for more efficient pagination 
  const { data, mutate, error, isLoading } = useSWR(`/api/entries/${uid}/${dbDate}/${fetchCount}`, fetcher,  {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });
  return { data: data as ResponseData, mutate, error, isLoading };
}