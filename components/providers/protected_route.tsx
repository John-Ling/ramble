import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const {authenticated, user, loading, check_auth_client} = useAuth();  

  check_auth_client();

  if (loading) return <h1>Loading</h1>
  if (!authenticated) return null;
  if (!user) return null;
  return (<>
  {children}
  </>);
}