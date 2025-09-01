"use client";
import { useEffect, useRef, useState, useCallback } from "react"
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { User } from "next-auth";
import { double_encode } from "@/lib/utils";


interface ResponseData {
  entries: JournalEntryReference[];
  finalEntry?:  JournalEntryReference;
  entryCount: number;
  areDocumentsLeft: boolean;
}

interface EntriesPageProps {
  user: User | null;
  dbDate: string;
  fetchCount: number;
  set_fetch_count: () => void;
  on_close: () => void;
  on_entry_select: (entry: JournalEntryReference, index: number) => void;
}

export default function EntriesPage({user, dbDate, fetchCount, set_fetch_count, on_close, on_entry_select}: EntriesPageProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const entryMenuRef = useRef<HTMLDivElement>(null);
  // const finalEntryRef = useRef<JournalEntryReference | null>(null);
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
          selectEntry();
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

  function selectEntry() {
    const entry: JournalEntryReference | undefined = entries[activeIndex];

    if (entry) {
      on_entry_select(entry, activeIndex);
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
    const refCopy = entryMenuRef.current;

    return () => {
      if (refCopy) {
        refCopy.removeEventListener("scroll", on_scroll);
      } 
    }
  }, [on_scroll]);

  const fetched = useEntries(user, dbDate, fetchCount); 

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
      <div className="bg-background w-4/5 lg:1/2 xl:w-1/3  h-[50vh]  lg:h-[35vh] z-40 flex flex-col overflow-scroll rounded-sm" ref={entryMenuRef}>
        <div className="flex justify-between sticky top-0 bg-card border-b-1 p-4">
          <h1 className="font-bold text-2xl">Entries</h1>
          <Button variant="ghost" size="icon" className="size-8" onClick={on_close}><X /></Button>
        </div>        
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-2  md:grid-cols-4 lg:gap-16 mt-10 p-2">
            {
              fetched.isLoading ? 
              <>
                {/* loading state */}
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
                <Skeleton className="h-[90px] w-[90px] rounded-lg bg-card"/>
              </>
              :
              entries?.map((entry: JournalEntryReference, i: number) => {
              return (
                <div key={i} onClick={selectEntry} onMouseOver={() => setActiveIndex(i)}  
                  className={`hover:cursor-pointer flex flex-col items-center p-4 rounded-md ${ i === activeIndex ? "bg-chart-2 text-black" : ""}`}
                >
                  <FileText size={48} />
                  <p className="text-sm">
                    {entry.name}
                  </p>
                </div>
              )
            })
            }
          </div>
        </div>
      </div>
      <div className="absolute w-full h-full bg-black/50 z-30" onMouseDown={on_close}></div>
    </>
  )
}

function useEntries(user: User | null, dbDate: string, fetchCount: number) {
  const uid = user?.id;
  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data, mutate, error, isLoading } = useSWR(uid && dbDate && fetchCount ? `/api/entries/${uid}/${double_encode(dbDate)}/${fetchCount}` : null, fetcher,  {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });
  return { data: data as ResponseData, mutate, error, isLoading };
}