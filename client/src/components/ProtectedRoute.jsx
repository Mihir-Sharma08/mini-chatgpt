import { Navigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-900 text-zinc-400">
        <LoaderCircle className="animate-spin" size={28} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}