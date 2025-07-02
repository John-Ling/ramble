"use client";
import { Button } from "../ui/button";
import { google_sign_in, google_sign_out } from "@/lib/firebase/auth";

export default function LoginForm() {
  return (
    <>
      <div className="flex justify-evenly">
        <Button variant="secondary" onClick={google_sign_in}>Login</Button>
        <Button variant="secondary" onClick={google_sign_out}>Logout</Button>
      </div>
    </>
  )
}