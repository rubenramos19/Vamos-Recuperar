import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">A carregar…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
