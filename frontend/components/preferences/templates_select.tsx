"use client";

import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export default function TemplatesSelect() {
  return (
    <> 
      <div className="h-96 w-full flex  flex-col items-start justify-center">
        <Textarea className="h-80 w-1/2" placeholder="Define your own journal template"/>
        {/* <Switch id="random-toggle"/>
        <Label htmlFor="random-toggle">Enable Random Prompts</Label> */}
      </div>
    </>
  )
} 