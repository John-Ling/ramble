"use client";


import { useEffect, useState, useRef, useCallback } from "react";
import SettingsMenu from "../settings-menu/settings_menu";
import EntriesPage from "./entries-page/entries_menu";
import { useAppState } from "@/hooks/useAppState";
import { db_date_to_date, date_to_db_date } from "@/lib/utils";

import { signOut, useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

import ProtectedRoute from "../providers/protected_route";




export default function JournalPage() {
  const user = useUser();
  const { session, status, check_auth_client } = useAuth();
  const [content, setContent] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [pendingSave, setPendingSave] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const currentDate: string = new Date().toLocaleDateString();
  const [dbDate, setDbDate] = useState<string>(date_to_db_date(currentDate))
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // entries menu
  const [entriesVisible, setEntriesVisible] = useState<boolean>(false);
  const [fetchCount, setFetchCount] = useState<number>(12);
  const todayDbDate = date_to_db_date(currentDate);

  // users can only read old entries not make edits to them
  const readOnly = db_date_to_date(currentDate) === dbDate;

  useEffect(() => {
    // autosave at fixed intervals
    const AUTOSAVE_INTERVAL = 2000;
    const interval = setInterval(autosave, AUTOSAVE_INTERVAL);
    return (() => {
      clearInterval(interval);
    })
  });


  const load_data = useCallback(async () => {
    if (!user) return;
  
    const response = await fetch(`http://localhost:3000/api/entries/${user.id}/${todayDbDate}/`);
    if (response.status === 200) {
      // set entry
      const entry: JournalEntry = await response.json() as JournalEntry;
      setContent(entry.content);
      setSaved(entry.content);
    } else {
      console.log("Could not get entry");
    }

    setLoadingData(false);
  }, [user])

  useEffect(() => {
    load_data();
  }, [load_data]);

  async function save_without_delay() {
    if (!user || user.id === undefined) return;

    setSaved(content);
    setPendingSave(false);
    // const entry: JournalEntry = { created: dbDate, content: content, favourite: false, tags: [] };
    
    const entry: JournalEntry = { created: dbDate, authorID: user.id, content: content };

    if (status === "authenticated") {
      const response = await fetch(`http://localhost:3000/api/entries/${user.id}/${todayDbDate}/`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "accept": "application/json"},
        body: JSON.stringify(entry)
      });
    }
    setPendingSave(true);
    textareaRef.current?.focus();
  }

  async function save_with_delay() {
    if (!user || user.id === undefined) return;
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, authorID: user.id, content: content };

    if (status === "authenticated") {
      const response = await fetch(`http://localhost:3000/api/entries/${user.id}/${todayDbDate}/`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "accept": "application/json"},
        body: JSON.stringify(entry)
      })
    }

    setTimeout(() => {
      setPendingSave(true);
      textareaRef.current?.focus();
    }, 1000);
    
    return;
  }

  async function autosave() {
    if (content !== saved && pendingSave) {
      await save_without_delay();
    }
    setPendingSave(true);
    return;
  }

  const load_entry = (entry: JournalEntry) => {
    setDbDate(entry.created);
    setContent(entry.content);
  }

  const on_entry_menu_close = () => {
    setEntriesVisible(false);
    textareaRef.current?.focus();
    return;
  }
  check_auth_client();


  return (
    <>
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <div className={`${entriesVisible ? "block" : "hidden"} fixed top-0 min-h-screen w-full flex justify-center items-center z-20`}>
            <EntriesPage uid={user?.id} dbDate={todayDbDate} fetchCount={fetchCount} set_fetch_count={() => setFetchCount(prev => prev + 12)} on_close={on_entry_menu_close} on_entry_select={load_entry}  />
          </div>

          {/* menubar */}
          <div className="flex w-full justify-center">
            <div className="flex w-full lg:w-3/4 justify-between">
              <h1 className="font-bold text-2xl">RAMBLE</h1>
              <SettingsMenu disabled={entriesVisible} onEntries={() => setEntriesVisible(true)} onLogout={signOut}/>
            </div>
          </div>
          {/* journal form */}
          <div className="w-full lg:w-3/5">
            <div className="flex justify-between pb-2">
              <h1 className="p-2">{db_date_to_date(dbDate)}</h1>
              <Button disabled={!pendingSave}  aria-disabled={!pendingSave} onClick={save_with_delay}>Save</Button>
            </div>
            <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" 
                      disabled={loadingData || readOnly || !pendingSave} 
                      placeholder={`${loadingData ? "Loading..." : "What's on your mind?"}`}  
                      className={`h-[85vh] ${readOnly ? "text-[#a2a2a2]" : ""}`} 
                      value={content}
                      ref={textareaRef}/>  
          </div>    
        </div> 
      </ProtectedRoute>
    </>
  )
}