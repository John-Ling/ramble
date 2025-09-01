"use client";

import { useEffect, useState, useRef } from "react";
import SettingsMenu from "../settings-menu/settings_menu";
import EntriesPage from "./entries-page/entries_menu";
// import VoiceRecorder from "./recorder/voice_recorder";
import { db_date_to_date, date_to_db_date, double_encode } from "@/lib/utils";

import { signOut, useSession } from "next-auth/react";
import { useUser } from "@/hooks/useUser";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "@/components/ui/skeleton"

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
  const todayDbDate = date_to_db_date(new Intl.DateTimeFormat("en-US").format(new Date()));
  const [dbDate, setDbDate] = useState<string>(todayDbDate);
  const [entryName, setEntryName] = useState<string>(db_date_to_date(todayDbDate));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // entries menu
  const [entriesVisible, setEntriesVisible] = useState<boolean>(false);
  const [fetchCount, setFetchCount] = useState<number>(12);

  const [readOnly, setReadOnly] = useState<boolean>(false);
  // users can only read old entries not make edits to them

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
    
    const entry: JournalEntryReqBody = {_id: "", name: db_date_to_date(dbDate), authorID: user.id, createdOn: dbDate, content: content};

    
    await fetch(`http://localhost:3000/api/entries/${user.id}/${double_encode(entryName)}/`, {
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
    const entry: JournalEntryReqBody = {_id: "", name: db_date_to_date(dbDate), authorID: user.id, createdOn: dbDate, content: content};

    console.log("Clicking ")

    await fetch(`http://localhost:3000/api/entries/${user.id}/${double_encode(entryName)}/`, {
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

  const load_entry = (entry: JournalEntryReference, index: number) => {
    // make only the first entry (at index 0) readable
    setReadOnly(index === 0 ? false : true);

    console.log(entry);
    // if entry has no name default to the date it was created on
    let target = entry.name;
    if (!target) {
      target = entry.createdOn;
    }
    setEntryName(target);
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

  const fetched = useLoadedEntry(user, entryName);

  useEffect(() => {
    if (!fetched.data) {
      setContent("");
      setSaved("");
    } else {
      const entry = fetched.data as JournalEntry;
      setContent(entry.content);
      setSaved(entry.content);
    }
  }, [fetched.data, fetched.error]);

  useEffect(() => {
    fetched.mutate();
  }, [entryName]);

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
          <div className="flex justify-between">

            <div className="w-[30ch] overflow-hidden">
              <h2 className="font-bold">{fetched.isLoading ? "Loading..." : entryName}</h2>
            </div>
        
            <div className="flex items-center">
              {/* <div className="flex items-center gap-x-3">
                <VoiceRecorder />
                <p className="text-sm w-[20ch]">Record</p>
              </div> */}
              <Button disabled={!pendingSave || fetched.isLoading || readOnly}  aria-disabled={!pendingSave} onClick={save_with_delay}>Save</Button>
            </div>
          </div>
          
          {
            fetched.isLoading ?  <div className="bg-card mt-2 h-[85vh] rounded-lg p-3 space-y-2">
              <Skeleton className="mb-2 h-4 w-[600px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[450px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[530px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[660px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[320px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[550px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[600px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[520px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[540px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[370px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[490px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[350px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[270px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[300px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[350px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[200px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[170px] bg-background" />
              <Skeleton className="mb-2 h-4 w-[50px] bg-background" />
            </div>
             : 
            <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" 
                    disabled={fetched.isLoading || readOnly} 
                    placeholder={`What's on your mind?`}  
                    className={`mt-2 h-[85vh] rounded-lg ${readOnly ? "text-[#a2a2a2]" : ""}`} 
                    value={content}
                    ref={textareaRef}/>  
          }
          
        </div>    
      </div> 
    </ProtectedRoute>
  )
}

function useLoadedEntry(user: User | null, entryName: string) {
  const uid = user?.id;
  const fetcher = (url: string) => fetch(url).then(r => r.json());  

  // load single single entry
  const { data, error, isLoading , mutate,} = useSWR(uid && entryName ? `/api/entries/${uid}/${double_encode(entryName)}/` : null, fetcher,  {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return { data: data, error, isLoading, mutate };
}