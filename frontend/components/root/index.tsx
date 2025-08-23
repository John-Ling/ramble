"use client";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useEffect } from "react";

export default function Page() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/journal");
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);
  
  return (
    <>
    </>
  )
}