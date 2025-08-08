import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "./useAppState";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useSession } from "next-auth/react";

export function useAuth() {
    const router = useRouter();
    const { data: session, status } = useSession();

    function check_auth_client() {
        // client side check for authentication
        useEffect(() => {
            if (status === "unauthenticated" ) {
                router.push("/login");
            }
        }, [status])
    }

    return { session, status, check_auth_client };
}