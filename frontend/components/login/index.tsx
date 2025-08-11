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
      <div className="min-h-screen w-full flex items-center justify-center flex-col">
        <div>
          <h1 className="font-bold text-4xl">Ramble</h1>
          <h2 className="text-3xl">What&apos;s on your mind?</h2>
          <LoginForm />
        </div>
      </div>
    </>
  )
}