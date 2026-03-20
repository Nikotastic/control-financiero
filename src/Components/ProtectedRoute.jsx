import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Envuelve rutas privadas.
 * - Si aún se está verificando la sesión (user === undefined) → muestra spinner
 * - Si no hay sesión (user === null) → redirige a /login
 * - Si hay sesión → renderiza los hijos
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
