"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function useTokenRefresh() {
    const { data: session, update } = useSession();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log("Checking");
        if (!session?.expires) {
            console.log("Expires is null");
            return;
        };
        const expireTimestamp = Math.floor(new Date(session.expires).getTime() / 1000);

        console.log("TIMESTAMP");
        console.log(expireTimestamp);

        // Calculate when to refresh (30 seconds before expiry)
        const shouldRefreshAt = expireTimestamp - 30000;
        const now = Date.now();

        // Clear any existing interval
        if (intervalRef.current) {
            clearTimeout(intervalRef.current);
        }

        // If token is already expired or about to expire refresh immediately
        if (now >= shouldRefreshAt) {
            console.log('Token expired or about to expire, refreshing...');
            // update();
        } else {
            // Schedule refresh for just before expiry
            const timeUntilRefresh = shouldRefreshAt - now;
            console.log(`Scheduling token refresh in ${timeUntilRefresh / 1000} seconds`);
            
            intervalRef.current = setTimeout(() => {
                console.log('Refreshing token...');
                // update();
            }, timeUntilRefresh);
        }

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [session?.expires, update]);

    // Also refresh if we detect the token was refreshed server-side
    useEffect(() => {
        if (session?.refreshed) {
            console.log('Token was refreshed server-side, updating session');
            // Force update to get the latest session
            // update();
        }
    }, [session?.refreshed, update]);
    return session;
}