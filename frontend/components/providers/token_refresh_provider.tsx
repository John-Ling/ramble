"use client";

import { useTokenRefresh } from "@/hooks/useTokenRefresh";

interface TokenRefreshProviderProps {
  children: React.ReactNode
}

export default function TokenRefreshProvider({ children }: TokenRefreshProviderProps) {
  useTokenRefresh();
  return <>{children}</>;
}