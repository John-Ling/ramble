"use client";

import { Textarea } from "../ui/textarea";
import { useEffect, useState, useRef, useCallback } from "react";
import SettingsMenu from "../settings-menu/settings_menu";
import EntriesPage from "./entries-page/entries_menu";

import { useAuth } from "@/hooks/useAuth";
import { get_entry, write_entry } from "@/lib/firebase/db";

import { Button } from "../ui/button";

import { db_date_to_date, date_to_db_date, logout_google  } from "@/lib/utils";

export default function JournalPage() {
  const {authenticated, user, loading, check_auth_client} = useAuth();  
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
  const originalDbDate = date_to_db_date(currentDate);

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

  const load_data = useCallback(() => {
    // load data
    if (!!user) {
      get_entry(user.uid, dbDate).then((entry: JournalEntry | null) => {
        if (!!entry) {
          setContent(entry.content);
          setSaved(entry.content);
        }
        setLoadingData(false);
      });  
    }
  }, [user]);

  useEffect(() => {
    load_data();
  }, [load_data]);

  
  check_auth_client();

  // probably add provider component called protected route or something
  // do checks there instead of here
  if (loading) return <h1>Loading</h1>
  if (!authenticated) return null;
  if (!user) return null;

  async function save_without_delay() {
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, content: content, favourite: false, tags: [] };
    if (!!user) {
      await write_entry(user.uid, dbDate, entry);
    }

    setPendingSave(true);
    textareaRef.current?.focus();
  }

  async function save_with_delay() {
    console.log("Autosaving");
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, content: content, favourite: false, tags: [] };
    if (!!user) {
      await write_entry(user.uid, dbDate, entry);
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

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        {entriesVisible ? <EntriesPage user={user} dbDate={originalDbDate} fetchCount={fetchCount} set_fetch_count={() => setFetchCount(prev => prev + 12)} on_close={on_entry_menu_close} on_entry_select={load_entry}  /> : null}

        {/* menubar */}
        <div className="flex w-full justify-center">
          <div className="flex w-full lg:w-3/4 justify-between">
            <h1 className="font-bold text-2xl">RAMBLE</h1>
            <SettingsMenu disabled={entriesVisible} onEntries={() => setEntriesVisible(true)} onLogout={logout_google}/>
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
    </>
  )
}