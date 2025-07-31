"use client";

import { useAuth } from "@/hooks/useAuth";

export default function PreferencesPage() {
  const {authenticated, user, loading, check_auth_client} = useAuth();  

  check_auth_client();

  if (loading) return <h1>Loading</h1>
  if (!authenticated) return null;
  if (!user) return null;
}