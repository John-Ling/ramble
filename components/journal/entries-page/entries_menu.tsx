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
  const [activeIndex, setActiveIndex] = useState<number>(2);
  const activeEntry = useRef<JournalEntry | null>(null);
  
  const fetched = useEntries(user, dbDate, 5);
     
  if (!fetched) return null;
  const entries = fetched.entries;
  // if (!entries)  return;
  console.log("Active index ", activeIndex);

  // if (entries === undefined) return null;
  
  // form display window by taking n indices up and below active index
  

  // display only 5 at a time 

  // keep track of activeIndex if it exceeds 4 or falls below 0 replace

  // if active index is a 1 away from the boundary make a call to get above 
  // same logic applies for below
  // 

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex(prev => prev - 1);
          check_bounds(activeIndex - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex(prev => prev + 1);
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
    const buffer: JournalEntry[] = [];
    if (!entries) {
      return;
    }
    const startIndex = entries.map(entry => entry.created).indexOf(dbDate);
    for (let i = Math.max(startIndex - 2, 0); i < Math.min(startIndex + 2, entries.length); i++) {
      buffer.push(entries[i]);
    }

    console.log(startIndex);
    setDisplayEntries([...buffer]);
  }, [entries]);
  
  function format_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2]}/${split[1]}/${split[0]}`
  }

  function check_bounds(index: number) {
    if (!entries) {
      return;
    }

    // check if the index has is 1 step away from the boudary
    // if so change 

    // if the maximum or minimum has been reached however simply stop the user from progressing
    const upper = Math.min(activeIndex + 2, entries.length);
    const lower = Math.max(activeIndex - 2, 0 );

    if (index + 1 >= displayEntries.length - 1) {
      console.log('Reached end');
    } else if (index - 1 <= 0) {
      console.log("Reached start");
    }
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