import { useSession } from "next-auth/react";

export function useUser() {
    const { data: session, status } = useSession();
    if (session) return session.user;
    return null;
}