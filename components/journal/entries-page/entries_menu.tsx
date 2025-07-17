"use client";
import { get_n_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useRef, useState, useMemo } from "react"
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
  const [loading, setLoading] = useState<boolean>(true);
  const [displayEntries, setDisplayEntries] = useState<JournalEntry[]>([]);

  // index for the viewable entries
  const [activeIndex, setActiveIndex] = useState<number>(2);

  // index for all the currently pulled entries 
  // starts in the middle
  const entriesIndex = useRef<number>(5); // change to n later

  const activeEntry = useRef<JournalEntry | null>(null);

  // let fetched = undefined;
  // if (activeEntry.current === null) {
  //   fetched = useEntries(user, dbDate, 5);
  // } else {
  //   fetched = useEntries(user, activeEntry.current.created, 5);
  // }

  const fetched = useEntries(user, dbDate, 5);
  
     
  if (!fetched) return null;
  const entries = fetched.entries;
  
  // form display window by taking n indices up and below active index
  

  // display only 5 at a time 

  // keep track of activeIndex if it exceeds 4 or falls below 0 replace

  // if the active index exceeds or goes below the window.
  // take the next element or previous element (depends if going above or below)
  // pop the back and push it or vice versa

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          // setActiveIndex(prev => prev - 1);
          entriesIndex.current -= 1;
          check_bounds(activeIndex - 1);
          
          break;
        case "ArrowDown":
          event.preventDefault();
          // setActiveIndex(prev => prev + 1);
          entriesIndex.current += 1;
          check_bounds(activeIndex + 1);
          
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
    if (!entries) {
      return;
    }
    const buffer: JournalEntry[] = [];
    const startIndex = entries.map(entry => entry.created).indexOf(dbDate);
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

  function check_bounds(index: number) {
    // function to adjust the active index
    // checks if index exceeds bounds of view
    // if so it move to the "next page" of the view
    // if the index exceeds bounds of entries
    // makes a call to the API to pull more data

    if (!entries) return;

    if (entriesIndex.current < 0 || entriesIndex.current >= entries.length) {
      console.log("Entries index reached bounds need to pull more data")
      
      if (entriesIndex.current < 0 ) {
        entriesIndex.current += 1; 
      } else {
        entriesIndex.current -= 1;
      }

      return;
    }

    
    console.log("Active index ", activeIndex);
    console.log("Index ", index);
    console.log("Entries index", entriesIndex.current);

    // if index goes below bounds of view
    if (index < 0) {
      console.log("Gone below view")
      // pop at front and push to back

      // get back element 
      let backEntry: JournalEntry | undefined = undefined;

      // if (activeIndex >= 0) {
      backEntry = entries[entriesIndex.current];
      // }

      if (backEntry === undefined) {
        return;
      }

      console.log("Back entry");
      console.log(backEntry);

      // pop front element
      setDisplayEntries(prev => prev.filter((_, index) => index !== prev.length - 1));
      setDisplayEntries(prev => [backEntry, ...prev])
      return;
    } else if (index >= displayEntries.length) { // index exceeds bounds of view
      console.log("exceeded view")
      // push at front and pop at back
      let frontEntry: JournalEntry | undefined = undefined;
      // if (activeIndex >= 0) {
        frontEntry = entries[entriesIndex.current];
      // }

      if (frontEntry === undefined) {
        return;
      }

      console.log("Front entry")
      console.log(frontEntry);
      // pop back element
      setDisplayEntries(prev => prev.filter((_, index) => index !== 0));
      setDisplayEntries(prev => [...prev, frontEntry])
      return;
    }

    // if the maximum or minimum has been reached however simply stop the user from progressing
    // const upper = Math.min(activeIndex + 2, entries.length);
    // const lower = Math.max(activeIndex - 2, 0 );

    // change dbdate
    const newDate: string= displayEntries[index].created;

    console.log(newDate);
    activeEntry.current = displayEntries[index];
    if (index >= displayEntries.length - 1) {
      console.log('Reached end');
      // update active entry which means data will be pulled next render

      // 
    } else if (index - 2 <= 0) {
      console.log("Reached start");
    }

    setActiveIndex(index);
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

// function usePaginatedEntries(user: User | null, dbDate: string, n: number) {
//   const [pages, setPages] = useState<Set<number>>(new Set([0])); // track loaded pages
//   const [totalEntries, setTotalEntries] = useState<number | null>(null);

//   if (!user) return null;

//   // generate unique keys to represent entries
//   // in cache
//   const swrKeys = useMemo(() => {
//     return Array.from(pages).map(() => 
//       ['entries', user.uid, dbDate].join('-')
//     );
//   }, [pages, user, dbDate]);

//   // use SWR to fetch all pages (maybe change to smaller amount)
//   // for each db date
//   const swrResults = swrKeys.map(key => {
//     const [, , dbDate] = key.split('-'); // extract db date
//     return useSWR(dbDate, async () => {
//       const response = await get_n_entries(user, dbDate, n);
//       return response;
//     });
//   });

//   // combine all entries from loaded pages
//   const allEntries = useMemo(() => {
//     // map swr cache keys to journal entries
//     const entriesMap = new Map<string, JournalEntry>();
    
//     swrResults.forEach((result, index) => {
//       if (result.data?.entries) {
//         result.data.entries.map((entry: JournalEntry) => {
//           entriesMap.set(entry.id, entry);
//         });
        
//         // Update total count if available
//         if (result.data.total !== undefined) {
//           setTotalEntries(result.data.total);
//         }
//       }
//     });

//     // Sort entries by date (assuming entries are chronological)
//     return Array.from(entriesMap.values()).sort((a, b) => 
//       new Date(a.created).getTime() - new Date(b.created).getTime()
//     );
//   }, [swrResults]);

// }

function useEntries(user: User | null, dbDate: string, n: number) {
  if (!user) {
    console.log("null user")
    return null;
  }

  const {data, error, isLoading} = useSWR([user, dbDate, n], ([user, dbDate, n]) => get_n_entries(user, dbDate, n), {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute 
  });

  return {entries: data, error, isLoading};
}