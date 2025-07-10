"use client";
import { get_n_entries } from "@/lib/firebase/db";
import { User } from "firebase/auth";
import { useEffect, useState } from "react"


interface EntriesPageProps {
  user: User | null
  dbDate: string
  n: number
}

export default function EntriesPage({user, dbDate, n}: EntriesPageProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    get_n_entries(user, dbDate, n).then((entries) => {
      if (!entries) {
        return;
      }
      console.log(entries);
      setEntries(entries);
    });

  }, []);


  function format_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2]}/${split[1]}/${split[0]}`
  }


  return (
    <>
      <div className="fixed top-0 min-h-screen w-full flex justify-center items-center z-20">
        <div className="bg-black w-1/3 h-[20vh] z-40 p-2">
          <h1 className="font-bold">Entries</h1>
          {entries.map((entry: JournalEntry, i: number) => {
            const formatted: string = format_date(entry.created);
            return (
              <div key={i}>
                <p className={`${entry.created === dbDate ? "text-amber-600" : "text-white"}`}>{format_date(entry.created)}</p>
              </div>
            )
          })}
        </div>
        <div className="absolute w-full h-full bg-black/50 z-30"></div>
      </div>
    </>
  )
}