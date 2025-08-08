"use client";
import { Button } from "../ui/button";
import { google_sign_in, google_sign_out } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function LoginForm() {
  const router = useRouter();

  const on_login = async () => {
    signIn("google");
    router.push("/journal");
  }

  const on_logout = async () => {
    signOut();
  }

  return (
    <>
      <div className="flex justify-evenly">
        <Button variant="secondary" onClick={on_login}>Login</Button>
        <Button variant="secondary" onClick={on_logout}>Logout</Button>
      </div>
    </>
  )
}