import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, Shield, DollarSign } from "lucide-react";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Si ya hay sesión activa, ir directo al dashboard
  if (user) return <Navigate to="/" replace />;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Forzar que siempre pregunte qué cuenta usar
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Fondo con orbes animados */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="login-wrapper">
        {/* Panel izquierdo: branding */}
        <div className="login-brand-panel">
          <div className="brand-icon-wrap">
            <DollarSign size={40} color="#00c896" />
          </div>
          <h1 className="brand-title">Control Financiero</h1>
          <p className="brand-subtitle">
            Tu panel inteligente para gestionar ingresos, gastos, presupuestos e
            inversiones — todo en un solo lugar.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <TrendingUp size={20} color="#00c896" />
              <span>Análisis de movimientos en tiempo real</span>
            </div>
            <div className="brand-feature">
              <Shield size={20} color="#00c896" />
              <span>Datos seguros con Firebase Auth</span>
            </div>
            <div className="brand-feature">
              <DollarSign size={20} color="#00c896" />
              <span>Presupuestos e inversiones personalizados</span>
            </div>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Bienvenido de vuelta</h2>
            <p className="login-desc">
              Inicia sesión para acceder a tu panel financiero
            </p>
          </div>

          {error && (
            <div className="login-error">
              <span>{error}</span>
            </div>
          )}

          <button
            id="btn-google-login"
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <svg
                className="google-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="22"
                height="22"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 5.9 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 5.9 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8H6c3.4 8.1 11.3 14 18 14z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C40.8 35.3 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z"
                />
              </svg>
            )}
            {loading ? "Iniciando sesión…" : "Continuar con Google"}
          </button>

          <p className="login-legal">
            Al continuar, aceptas los Términos de Servicio y la Política de
            Privacidad. Tus datos financieros son privados y solo tú los puedes
            ver.
          </p>
        </div>
      </div>
    </div>
  );
}
