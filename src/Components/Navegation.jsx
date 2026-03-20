import React, { useState } from "react";
import {
  House,
  CircleDollarSign,
  HandCoins,
  Receipt,
  FlagTriangleRight,
  TrendingUp,
  Settings,
  Menu,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navegation() {
  const [mostrarMenu, setMostrarMenu] = useState(true);
  const { user, logout } = useAuth();

  const toggleMenu = () => setMostrarMenu(!mostrarMenu);

  return (
    <nav
      className={`nav-sidebar ${mostrarMenu ? "nav-expanded" : "nav-collapsed"}`}
    >
      {/* Cabecera con logo + toggle */}
      <div className="nav-header">
        <h2 className="nav-brand">{mostrarMenu && "Finanzas"}</h2>
        <button className="nav-toggle" onClick={toggleMenu} aria-label="Menú">
          <Menu size={20} />
        </button>
      </div>

      {/* Avatar del usuario */}
      {user && (
        <div className="nav-user">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=00c896&color=fff`}
            alt="avatar"
            className="nav-avatar"
          />
          {mostrarMenu && (
            <div className="nav-user-info">
              <p className="nav-user-name">{user.displayName?.split(" ")[0]}</p>
              <p className="nav-user-email">{user.email}</p>
            </div>
          )}
        </div>
      )}

      {/* Links */}
      <ul className="nav-links">
        <li>
          <Link to="/" className="nav-link">
            <House size={20} />
            {mostrarMenu && <span>Panel Principal</span>}
          </Link>
        </li>
        <li>
          <Link to="/ingresos" className="nav-link">
            <CircleDollarSign size={20} />
            {mostrarMenu && <span>Ingresos</span>}
          </Link>
        </li>
        <li>
          <Link to="/gastos" className="nav-link">
            <HandCoins size={20} />
            {mostrarMenu && <span>Gastos</span>}
          </Link>
        </li>
        <li>
          <Link to="/presupuesto" className="nav-link">
            <Receipt size={20} />
            {mostrarMenu && <span>Presupuesto</span>}
          </Link>
        </li>
        <li>
          <Link to="/reportes" className="nav-link">
            <FlagTriangleRight size={20} />
            {mostrarMenu && <span>Reportes</span>}
          </Link>
        </li>
        <li>
          <Link to="/inversiones" className="nav-link">
            <TrendingUp size={20} />
            {mostrarMenu && <span>Inversiones</span>}
          </Link>
        </li>
      </ul>

      {/* Footer: configuración + cerrar sesión */}
      <div className="nav-footer">
        <Link to="/configuracion" className="nav-link">
          <Settings size={20} />
          {mostrarMenu && <span>Configuración</span>}
        </Link>
        <button className="nav-link nav-logout" onClick={logout} id="btn-logout">
          <LogOut size={20} />
          {mostrarMenu && <span>Cerrar sesión</span>}
        </button>
      </div>
    </nav>
  );
}
