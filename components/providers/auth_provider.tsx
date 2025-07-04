"use client";
import { useEffect } from "react";
import { useAppState } from "@/hooks/useAppState";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthProvider() {  
  const login = useAppState((state) => state.signIn);
  const logout = useAppState((state) => state.signOut);
  useEffect(() => {
    // check if user is already authenticated  
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Logged in");
        login();
      } else {
        console.log("Logged out");
        logout();
      }
    })
  }, [])
  return null;
}