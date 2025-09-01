"use client";

import { useRouter } from "next/navigation";
import LoginForm from "./login_form"
import { useSession } from "next-auth/react";
import { useEffect } from "react";


export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/journal");
    }
  }, [status, session, router])

  if (status === "loading") {
    return <p>Loading...</p>
  }

  return (
    <>
      <div className="min-h-[75vh] w-full flex items-center justify-center flex-col">
        <div className="p-5 pl-10 pr-10 w-1/4  bg-background  border-2  rounded-lg flex flex-col gap-4">
          <h1 className="font-bold text-5xl text-center mt-10 text-primary">RAMBLE</h1>
          <h2 className="text-xl text-center">What&apos;s on your mind?</h2>
          
          <LoginForm />
        </div>
      </div>
    </>
  )
}