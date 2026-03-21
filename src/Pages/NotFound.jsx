import React from "react";
import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "var(--bg-1)",
        color: "var(--text)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          padding: "3rem",
          maxWidth: "500px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <Compass size={70} style={{ color: "var(--blue)" }} />
        </div>
        <h1
          style={{
            fontSize: "4.5rem",
            margin: "0",
            fontWeight: "900",
            background: "linear-gradient(135deg, var(--blue), var(--green))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-2px"
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: "1.6rem", margin: "10px 0 20px", fontWeight: "600" }}>
          Parece que te perdiste
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "35px", lineHeight: "1.6", fontSize: "0.95rem" }}>
          La ruta que buscas no existe en tu Control Financiero o el enlace está roto.
          No te preocupes, el dinero sigue a salvo. Vuelve a tierra firme.
        </p>
        <Link
          to="/"
          className="btn-primary"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            padding: "12px 28px",
            fontSize: "1rem",
            textDecoration: "none",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <Home size={18} />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
