"use client";

import { useEffect, useState, useRef } from "react";
import SettingsMenu from "../settings-menu/settings_menu";
import EntriesPage from "./entries-page/entries_menu";
import { db_date_to_date, date_to_db_date } from "@/lib/utils";

import { signOut, useSession } from "next-auth/react";
import { useUser } from "@/hooks/useUser";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

import ProtectedRoute from "../providers/protected_route";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { User } from "next-auth";

export default function JournalPage() {
  const { update } = useSession();
  const router = useRouter();
  const user = useUser();
  const [content, setContent] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [pendingSave, setPendingSave] = useState<boolean>(true);
  const currentDate: string = new Date().toLocaleDateString();
  const [dbDate, setDbDate] = useState<string>(date_to_db_date(currentDate))
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // entries menu
  const [entriesVisible, setEntriesVisible] = useState<boolean>(false);
  const [fetchCount, setFetchCount] = useState<number>(12);
  const todayDbDate = date_to_db_date(currentDate);

  // users can only read old entries not make edits to them
  const readOnly = dbDate !== todayDbDate;

  // access tokens take around 1 hour to expire so refresh them 
  // 5 minutes before they do
  // i know this isn't the best solution but fuck you
  useEffect(() => {
    setTimeout(async () => {
      console.log("Updating");
      await save_with_delay();
      
      update();

    }, 3300 * 1000);
  }, [update]);

  useEffect(() => {
    // autosave at fixed intervals
    const AUTOSAVE_INTERVAL = 1000;
    const interval = setInterval(async () => {
      if (content !== saved && pendingSave) {
        await save_without_delay();
      }
      setPendingSave(true);
    }, AUTOSAVE_INTERVAL);
    return (() => {
      clearInterval(interval);
    })
}, [content, saved, pendingSave]);

  async function save_without_delay() {
    if (!user || user.id === undefined) return;

    setSaved(content);
    setPendingSave(false);
    
    const entry: JournalEntry = { created: dbDate, authorID: user.id, content: content };

    await fetch(`http://localhost:3000/api/entries/${user.id}/${todayDbDate}/`, {
      method: "PUT",
      headers: {"Content-Type": "application/json", "accept": "application/json"},
      body: JSON.stringify(entry)
    });
    setPendingSave(true);
    textareaRef.current?.focus();
  }

  async function save_with_delay() {
    if (!user || user.id === undefined) return;
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, authorID: user.id, content: content };

    await fetch(`http://localhost:3000/api/entries/${user.id}/${todayDbDate}/`, {
      method: "PUT",
      headers: {"Content-Type": "application/json", "accept": "application/json"},
      body: JSON.stringify(entry)
    })
    setTimeout(() => {
      setPendingSave(true);
      textareaRef.current?.focus();
    }, 1000);
    
    return;
  }

  const load_entry = (entry: JournalEntryReference) => {
    console.log(entry);
    setDbDate(entry.created);
  }

  
  const on_entry_menu_close = () => {
    setEntriesVisible(false);
    textareaRef.current?.focus();
    return;
  }

  const on_pref = () => {
    router.push("/preferences");
    return;
  }

  const on_entry = () => {
    setEntriesVisible(true);
    return;
  }

  const on_dashboard = () => {
    router.push("/dashboard");
    return;
  }

  // const trigger_theme = () => {
  //   document.body.setAttribute("data-theme", "gruvbox");
  // }

  let fetched = useLoadedEntry(user, dbDate);

  useEffect(() => {
    if (fetched.data) {
      const entry = fetched.data as JournalEntry;
      setContent(entry.content);
      setSaved(entry.content);
    }
  }, [fetched.data]);

  useEffect(() => {
    fetched.mutate();
  }, [dbDate]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col justify-center items-center">
        { entriesVisible ? 
        <div className={`fixed top-0 min-h-screen w-full flex justify-center items-center z-20`}>
          <EntriesPage user={user} dbDate={todayDbDate} fetchCount={fetchCount} 
                      set_fetch_count={() => setFetchCount(prev => prev + 12)} 
                      on_close={on_entry_menu_close} on_entry_select={load_entry} 
          />
        </div> : null
        }
      
        {/* menubar */}
        <div className="flex w-full justify-center">
          <div className="flex w-full lg:w-3/4 justify-between">
            <h1 className="font-bold text-2xl">RAMBLE</h1>
            <SettingsMenu disabled={entriesVisible} 
                          on_entries={on_entry} 
                          on_prefs={on_pref}
                          on_logout={signOut}
                          on_dashboard={on_dashboard}/>
          </div>
        </div>
        {/* journal form */}
        <div className="w-full lg:w-3/5">
          <div className="flex justify-between pb-2">
            <h1 className="p-2">{fetched.isLoading ? "Loading..." : db_date_to_date(dbDate)}</h1>
            <Button disabled={!pendingSave}  aria-disabled={!pendingSave} onClick={save_with_delay}>Save</Button>
          </div>
          <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" 
                    disabled={fetched.isLoading || readOnly} 
                    placeholder={`${fetched.isLoading ? "Loading..." : "What's on your mind?"}`}  
                    className={`h-[85vh] ${readOnly ? "text-[#a2a2a2]" : ""}`} 
                    value={content}
                    ref={textareaRef}/>  
        </div>    
      </div> 
    </ProtectedRoute>
  )
}

function useLoadedEntry(user: User | null, dbDate: string) {
  const uid = user?.id;
  const fetcher = (url: string) => fetch(url).then(r => r.json());  

  // load single single entry
  const { data, error, isLoading , mutate,} = useSWR(uid && dbDate ? `/api/entries/${uid}/${dbDate}/` : null, fetcher,  {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return { data: data, error, isLoading, mutate };
}