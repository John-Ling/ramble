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
  const [entriesVisible, setEntriesVisible] = useState<boolean>(false);

  // format date into dbDate
  function format_date(date: string) {
    const split: string[] = date.split('/');
    return `${split[2]}-${split[1]}-${split[0]}`
  }

  const dbDate: string = format_date(currentDate);

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
      get_entry(user, dbDate).then((entry: JournalEntry | null) => {
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

  function save() {
    setSaved(content);
    setPendingSave(false);
    const entry: JournalEntry = { created: dbDate, content: content, favourite: false, tags: [] };
    if (!!user) {
      write_entry(user, dbDate, entry);
    }

    setPendingSave(true);
    return;
  }

  function autosave() {
    if (content !== saved && pendingSave) {
      // run save code
      save();
      return;
    } 
    setPendingSave(true);
    return;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center">
        {/* entry selector  */}
        {entriesVisible ? <EntriesPage user={user} dbDate={dbDate} n={2} onClose={() => setEntriesVisible(false)} /> : null}
        {/* menubar */}
        <div className="flex w-full justify-center">
          <div className="flex w-full lg:w-3/4 justify-between">
            <h1 className="font-bold text-2xl">Ramble</h1>
            <SettingsMenu onEntries={() => setEntriesVisible(true)} onLogout={google_sign_out}/>
          </div>
        </div>
        {/* journal form */}
        <div className="w-full lg:w-3/5">
          <div className="flex justify-between pb-2">
            <h1 className="p-2">{currentDate}</h1>
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