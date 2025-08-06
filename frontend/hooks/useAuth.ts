import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "./useAppState";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export function useAuth() {
    const router = useRouter();
    const login = useAppState((state) => state.signIn);
    const user = useAppState((state) => state.user);
    const authenticated = useAppState((state) => state.authenticated);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                console.log("User is logged in");
                login(user);
            } else {
                console.log('User is logged out');
            }
            setLoading(false);
        })
        return () => unsubscribe();
    }, []);

    function check_auth_client() {
        // client side check for authentication
        useEffect(() => {
            if (!loading && !authenticated ) {
                router.push("/login");
            }
        }, [loading, authenticated, router])
    }

    return {authenticated, user, loading, check_auth_client};
}