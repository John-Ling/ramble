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
  const PREFETCH_THRESHOLD: number = 3; 

  // array of journal entries to show the user
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>([]);
  const [done, setDone] = useState<boolean>(false);

  // index for the viewable entries
  const [activeIndex, setActiveIndex] = useState<number>(2);
  const [countBefore, setCountBefore] = useState<number>(5);
  const [countAfter, setCountAfter] = useState<number>(5);

  // index for all the currently pulled entries 
  // starts in the middle
  const entriesIndex = useRef<number>(5); // change to n later
  const activeEntry = useRef<JournalEntry | null>(null);

  // keep track of whether we are pre-fetching data before or after
  // prevents duplicate requests being made
  const prefetchingStatus = useRef<{ before: Boolean; after: Boolean}>( {
    before: false,
    after: false
  });


  // move count before and after out of component to cache 

  // TODO come up with a more efficient way of pulling the data
  // but knowing me I probably won't
  const fetched = useEntries(user, dbDate, countBefore, countAfter);
   
  if (!fetched) return null;
  const data = fetched.data;
  // entire data fetched from firestore
  const entries = data?.entries;
  const pulledBeforeCount = data?.countBefore;
  const pulledAfterCount = data?.countAfter;

  console.log("Pulled before count ", pulledBeforeCount);
  console.log("Pulled after count ", pulledAfterCount);
  
  useEffect(() => {
    // event listeners for keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          navigate_entries(entriesIndex.current - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          navigate_entries(entriesIndex.current + 1);
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
  
  function format_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2]}/${split[1]}/${split[0]}`
  }

  const fetch_data = useCallback(async (direction: "before" | "after") => {
    if (!entries || prefetchingStatus.current[direction]) return
    prefetchingStatus.current[direction] = true;

    if (direction === "before") {
      setCountBefore(prev => prev + PREFETCH_THRESHOLD);
    } else {
      setCountAfter(prev => prev + PREFETCH_THRESHOLD);
    }

    // reset status after a short delay
    // (debouncing)
    setTimeout(() => {
      prefetchingStatus.current[direction] = false;
    }, 1000);
  }, [entries])

  const check_bounds_and_fetch = useCallback(() => {
    if (!entries) return;
    const currentPosition: number = entriesIndex.current;
    console.log("Current position ", currentPosition);
    if (done) {console.log("Not happening"); return};
    // console.log("Checking bounds");

    
    const entriesCount: number = entries.length;


    // fetch data if bounds are exceeded
    if (currentPosition < PREFETCH_THRESHOLD && !prefetchingStatus.current.before) {
      fetch_data("before");
      // prevent rendering loop
      // actual position will be set in in a side effect
      // entriesIndex.current += 1;
    } else if (currentPosition > entriesCount - PREFETCH_THRESHOLD && !prefetchingStatus.current.after) {
      fetch_data("after");
      // prevent rendering loop
      // actual position will be set in in a side effect
      // entriesIndex.current -= 1
    }

    setDone(true);
  }, [entries]);

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
    check_bounds_and_fetch();
  }, [entries, check_bounds_and_fetch])

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

  useEffect(() => {
    // set position of entries index

    // position is calculated by 
    // count before % DISPLAY_SIZE  + current position
    if (pulledBeforeCount === undefined) return;
  
    console.log("Calculating index ");
    console.log("Current index is ", entriesIndex.current);
    console.log("MOdulus ", pulledBeforeCount % DISPLAY_SIZE);


    const newIndex: number = pulledBeforeCount % DISPLAY_SIZE + entriesIndex.current

    console.log("Index is ", newIndex);
    entriesIndex.current = newIndex;
    update_display_entries();

  }, [pulledBeforeCount])


  function entry_index_out_of_bounds() {
    if (!entries) return true;

    if (entriesIndex.current < 0 || entriesIndex.current >= entries.length) {
      console.log("Entries index reached bounds")
      return true;
    }
    return false;
  }

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

  // console.log("calling useEntries");
  // console.log("countBefore ", countBefore);
  // console.log("countAfter ", countAfter);

  const { data, error, isLoading } = useSWR([user, dbDate, countBefore, countAfter], 
                                            ([user, dbDate, countBefore, countAfter]) => get_entries(user, dbDate, countBefore, countAfter), {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return {data: data, error, isLoading};
}