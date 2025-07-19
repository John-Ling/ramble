"use client";
import { get_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useRef, useState, useCallback } from "react"
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

interface EntriesPageProps {
  user: User | null
  dbDate: string
  n: number
  onClose: () => void
}

export default function EntriesPage({user, dbDate, n, onClose}: EntriesPageProps) {
  const DISPLAY_SIZE: number = 5; // pages to display per "page"

  // array of journal entries to show the user
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>([]);

  // index for the viewable entries
  const [activeIndex, setActiveIndex] = useState<number>(2);
  const [countBefore, setCountBefore] = useState<number>(5);
  const [countAfter, setCountAfter] = useState<number>(5);

  // index for all the currently pulled entries 
  // starts in the middle
  const entriesIndex = useRef<number>(5); // change to n later
  const activeEntry = useRef<JournalEntry | null>(null);
  const fetched = useEntries(user, dbDate, countBefore, countAfter);
   
  if (!fetched) return null;

  // entire data fetched from firestore
  const entries = fetched.entries;

  // set trigger bounds for entires
  // set 5 to n
  let bottomBound: number = 2;
  let topBound: number =  !!entries ?  Math.min(entries.length - 3, entries.length - 1) : 5 * 2 - 1; // change 5 to n  
  
  useEffect(() => {
    // event listeners for keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          // entriesIndex.current -= 1;
          navigate_entries(entriesIndex.current - 1);
          // check_bounds(activeIndex - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          // entriesIndex.current += 1;
          navigate_entries(entriesIndex.current + 1);
          // check_bounds(activeIndex + 1);
          break;
        case "Escape":
          event.preventDefault();
          onClose();
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

  // render active entry and adjacent entries
  useEffect(() => {
    if (!entries) return;
    const buffer: JournalEntry[] = [];
    const startIndex = entries.map((entry: JournalEntry) => entry.created).indexOf(dbDate);
    for (let i = Math.max(startIndex - 2, 0); i < Math.min(startIndex + 3, entries.length); i++) {
      buffer.push(entries[i]);
    }

    setDisplayEntries([...buffer]);
    activeEntry.current = entries[activeIndex];
  }, [entries]);
  
  function format_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2]}/${split[1]}/${split[0]}`
  }

  const update_display_entries = useCallback(() => {
    if (!entries || entries.length === 0) return;
    const currentPosition: number = entriesIndex.current;
    const half: number = Math.floor(DISPLAY_SIZE / 2);

    let startIndex = Math.max(0, currentPosition - half);
    let endIndex = Math.min(entries.length, startIndex + DISPLAY_SIZE);

    if (endIndex - startIndex < DISPLAY_SIZE && entries.length >= DISPLAY_SIZE) {
      // adjust if near the end
      startIndex = Math.max(0, endIndex - DISPLAY_SIZE);
    }

    const buffer = entries.slice(startIndex, endIndex);
    setDisplayEntries(buffer);

    // calculate the active index within the buffer
    const activeInBuffer = currentPosition - startIndex;
    setActiveIndex(Math.max(0, Math.min(activeInBuffer, buffer.length - 1)));

    // add check for prefetching
  }, [entries])

  const navigate_entries = useCallback((index: number) => {
    if (!entries || entry_index_out_of_bounds()) return;

    if (index >= 0 && index < entries.length) {
      entriesIndex.current = index;
      update_display_entries();
      return;
    }
    return;
  }, [entries, update_display_entries])

  useEffect(() => {
    if (entries && entries.length > 0) {
      update_display_entries();
    }
  }, [entries, update_display_entries]);


  function entry_index_out_of_bounds() {
    if (!entries) return true;

    if (entriesIndex.current < 0 || entriesIndex.current >= entries.length) {
      console.log("Entries index reached bounds")
      return true;
    }
    return false;
  }


   // don't look here disgusting code ewwwww
  // const check_bounds = useCallback((index: number) => {
  //   if (!entries || entry_index_out_of_bounds()) return;

  //   if (entriesIndex.current <= bottomBound || entriesIndex.current >= topBound) {
  //     // bounds of display entries are exceeded need to pull more data
  //     console.log("Need to pull data ");

  //     // then add it to our entries and increase the bounds respectively

  //     if (fetched.isLoading) {
  //       // if current fetching data
  //       console.log("Currently fetching data");
  //     } else {
  //       if (entriesIndex.current <= bottomBound) {
  //         setCountBefore(prev => prev + 5);
  //       } else {
  //         setCountAfter(prev => prev + 5);
  //       }
  //     }
  //   }

  //   // if index goes below bounds of buffer
  //   if (index < 0) {
  //     // pop at front and push to back

  //     // get back element 
  //     let backEntry: JournalEntry | undefined = undefined;
  //     backEntry = entries[entriesIndex.current];

  //     if (backEntry === undefined) return;

  //     // pop front element
  //     setDisplayEntries(prev => prev.filter((_, index) => index !== prev.length - 1));
  //     setDisplayEntries(prev => [backEntry, ...prev])
  //     return;
  //   } else if (index >= displayEntries.length) { // index exceeds bounds of view
  //     // push at front and pop at back
  //     let frontEntry: JournalEntry | undefined = undefined;
  //     frontEntry = entries[entriesIndex.current];

  //     if (frontEntry === undefined) return;
      
  //     // pop back element
  //     setDisplayEntries(prev => prev.filter((_, index) => index !== 0));
  //     setDisplayEntries(prev => [...prev, frontEntry])
  //     return;
  //   }

  //   // change dbdate
  //   const newDate: string= displayEntries[index].created;
  //   console.log(newDate);

  //   setActiveIndex(index);
  // }, [displayEntries.length]);


  return (
    <>
      <div className="fixed top-0 min-h-screen w-full flex justify-center items-center z-20">
        <div className="bg-black w-1/3 h-[20vh] z-40 p-2">
          <div className="flex justify-between">
            <h1 className="font-bold">Entries</h1>
            <Button variant="ghost" size="icon" className="size-8" onClick={onClose}><X /></Button>
          </div>
          {displayEntries.map((entry: JournalEntry, i: number) => {
            return (
              <div key={i}>
                <p className="whitespace-break-spaces">
                  <span className="text-amber-600 font-bold">{i === activeIndex ? ">" : "  "} </span>{format_date(entry.created)}
                </p>
              </div>
            )
          })}
        </div>
        <div className="absolute w-full h-full bg-black/50 z-30" onMouseDown={onClose}></div>
      </div>
    </>
  )
}

function useEntries(user: User | null, dbDate: string, countBefore: number, countAfter: number) {
  if (!user) {
    console.log("null user")
    return null;
  }

  console.log("calling useEntries");
  console.log("countBefore ", countBefore);
  console.log("countAfter ", countAfter);

  const { data, error, isLoading } = useSWR([user, dbDate, countBefore, countAfter], 
                                            ([user, dbDate, countBefore, countAfter]) => get_entries(user, dbDate, countBefore, countAfter), {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return {entries: data, error, isLoading};
}