"use client";

import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import SettingsMenu from "../settings-menu/settings_menu";
import EntriesPage from "./entries-page/entries_menu";

import { google_sign_out } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { get_entry, write_entry } from "@/lib/firebase/db";

import { Button } from "../ui/button";


export default function JournalPage() {
  const {authenticated, user, loading, check_auth_client} = useAuth();  
  const [content, setContent] = useState<string>("");
  const [saved, setSaved] = useState<string>("");
  const [pendingSave, setPendingSave] = useState<boolean>(false);
  const currentDate: string = new Date().toLocaleDateString();
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // entries menu
  const [entriesVisible, setEntriesVisible] = useState<boolean>(true);
  const [dbDate, setDbDate] = useState<string>(format_date(currentDate))
  const [fetchCount, setFetchCount] = useState<number>(12);

  // format date into dbDate
  function format_date(date: string) {
    const split: string[] = date.split('/');
    return `${split[2]}-${split[1]}-${split[0]}`
  }

  // const dbDate: string = format_date(currentDate);

  useEffect(() => {
    // attach event listener for autosave
    const interval = setInterval(autosave, 1000);
    return (() => {
      clearInterval(interval);
    })
  });

  useEffect(() => {
    // load data
    if (!!user) {
      console.log("Reading");
      get_entry(user.uid, dbDate).then((entry: JournalEntry | null) => {
        console.log("Got data back");
        if (!!entry) {
          console.log(entry.content);
          setContent(entry.content);
          setSaved(entry.content);
        }
        setLoadingData(false);
      });  
    }
  }, [user]);

  
  check_auth_client();

  // probably add provider component called protected route or something
  // do checks there instead of here
  if (loading) return <h1>Loading</h1>
  if (!authenticated) return null;
  if (!user) return null;

  async function save() {
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, content: content, favourite: false, tags: [] };
    if (!!user) {
      await write_entry(user.uid, dbDate, entry);
    }

    setPendingSave(true);
    return;
  }

  async function autosave() {
    if (content !== saved && pendingSave) {
      await save();
    } 
    setPendingSave(true);
    return;
  }

  function load_entry(entry: JournalEntry) {
    setDbDate(entry.created);
    setContent(entry.content);
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        {entriesVisible ? <EntriesPage user={user} dbDate={dbDate} fetchCount={fetchCount} set_fetch_count={() => setFetchCount(prev => prev + 12)} on_close={() => setEntriesVisible(false)} on_entry_select={load_entry}  /> : null}

        {/* menubar */}
        <div className="flex w-full justify-center">
          <div className="flex w-full lg:w-3/4 justify-between">
            <h1 className="font-bold text-2xl">RAMBLE</h1>
            <SettingsMenu disabled={entriesVisible} onEntries={() => setEntriesVisible(true)} onLogout={google_sign_out}/>
          </div>
        </div>
        {/* journal form */}
        <div className="w-full lg:w-3/5">
          <div className="flex justify-between pb-2">
            <h1 className="p-2">{dbDate}</h1>
            <Button disabled={!pendingSave}  aria-disabled={!pendingSave} onClick={save}>Save</Button>
          </div>
          <Textarea onChange={(e) => {setContent(e.target.value)}} autoCorrect="false" 
                    disabled={loadingData} 
                    placeholder={`${loadingData ? "Loading..." : "What's on your mind?"}`}  
                    className="h-[85vh]" 
                    value={content}/>  
        </div>    
      </div> 
    </>
  )
}