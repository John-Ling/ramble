"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/hooks/useAppState";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthProvider() {  
  const router = useRouter();
  const login = useAppState((state) => state.signIn);
  const logout = useAppState((state) => state.signOut);
  const loading = useAppState((state) => state.loading);
  useEffect(() => {
    // check if user is already authenticated  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(loading);

      if (user) {
        console.log("Logged in");
        login();
        router.push("/journal");
      } else {
        console.log("Logged out");
        logout();
        router.push("/login");
      }

      console.log(loading);
    })

    return () => unsubscribe();

  }, [router, login, logout])
  return null;
}