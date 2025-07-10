"use client";
import { get_n_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useState } from "react"
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
  // const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetched = useEntries(user, dbDate, n);
  if (!fetched) return null;

  const entries = fetched.entries;

  function format_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2]}/${split[1]}/${split[0]}`
  }

  return (
    <>
      <div className="fixed top-0 min-h-screen w-full flex justify-center items-center z-20">
        <div className="bg-black w-1/3 h-[20vh] z-40 p-2">
          <div className="flex justify-between">
            <h1 className="font-bold">Entries</h1>
            <Button variant="secondary" size="icon" className="size-8" onClick={onClose}><X /></Button>
          </div>
          
          {entries?.map((entry: JournalEntry, i: number) => {
            return (
              <div key={i}>
                <p className="whitespace-break-spaces">
                  <span className="text-amber-600 font-bold">{entry.created === dbDate ? ">" : "  "} </span>{format_date(entry.created)}
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

function useEntries(user: User | null, dbDate: string, n: number) {
  if (!user) {
    console.log("null user")
    return null;
  }
  const {data, error, isLoading} = useSWR([user, dbDate, n], ([user, dbDate, n]) => get_n_entries(user, dbDate, n), {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute 
  });
  console.log("Done");
  console.log(data);
  return {entries: data, error, isLoading};
}