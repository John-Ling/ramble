import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, status, check_auth_client } = useAuth();

  check_auth_client();

  if (status === "loading") return <h1>Loading</h1>
  if (status === "unauthenticated") return null;
  return (<>
    {children}
  </>);
}