import React from "react";
import Dashboard from "./Components/Dashboard";
import Navegation from "./Components/Navegation";
import AlertCenter from "./Components/AlertCenter";
import CalcWidget from "./Components/CalcWidget";

export function App({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <Navegation />
      </aside>
      <main id="dashboard" className="main-content">
        {/* Barra superior con campana de notificaciones */}
        <div className="topbar">
          <AlertCenter />
        </div>
        <section className="main-section animate-fade-in">
          {children ?? <Dashboard />}
        </section>

        {/* Calculadora flotante */}
        <CalcWidget />
      </main>
    </div>
  );
}
