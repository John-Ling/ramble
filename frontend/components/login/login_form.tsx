"use client";
import { Button } from "../ui/button";
import { google_sign_in, google_sign_out } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

import { useAppState } from "@/hooks/useAppState";
import { UserCredential } from "firebase/auth";

export default function LoginForm() {
  const login = useAppState((state) => state.signIn);
  const router = useRouter();
  async function onLogin() {
    const credential: UserCredential = await google_sign_in();
    login(credential.user);
    console.log("Redirecting");
    router.push("/journal");
  }

  async function onLogout() {
    await google_sign_out();
  }

  return (
    <>
      <div className="flex justify-evenly">
        <Button variant="secondary" onClick={onLogin}>Login</Button>
        <Button variant="secondary" onClick={onLogout}>Logout</Button>
      </div>
    </>
  )
}