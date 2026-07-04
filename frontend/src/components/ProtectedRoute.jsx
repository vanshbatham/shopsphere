import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // FIX: don't make any redirect decision until AuthContext has actually
  // finished its initial localStorage check. Without this, a direct nav or
  // page refresh into a protected route would read isAuthenticated's
  // pre-effect default (false) and bounce straight to /login even when a
  // valid token exists — see AuthContext.jsx for the full explanation.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-950">
        <div className="text-sm font-medium text-neutral-400 dark:text-neutral-500 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If they aren't logged in, send them to login, but remember where they tried to go!
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    requiredRole &&
    user?.role?.toUpperCase() !== requiredRole.toUpperCase()
  ) {
    // If they are logged in but don't have the right role, send them home.
    return <Navigate to="/" replace />;
  }

  // If they pass all checks, let them in!
  return children;
}
