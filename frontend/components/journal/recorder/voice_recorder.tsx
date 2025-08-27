"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceRecorder() {
  return (
    <>
      <Button variant="secondary" size="icon" className="size-8"><Mic/></Button>
    </>
  )
}