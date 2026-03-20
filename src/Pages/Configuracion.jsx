import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { Settings, User, Bell, Globe } from "lucide-react";

const Configuracion = () => {
  const { user } = useAuth();
  const { alertasActivadas, updateAlertas } = useSettings(user?.uid);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Configuración</h2>
          <p className="page-subtitle">Preferencias y perfil de usuario</p>
        </div>
      </div>

      {/* Perfil */}
      <div className="card">
        <h3 className="card-title">
          <User size={18} /> Perfil
        </h3>
        <div className="profile-row">
          <img
            src={
              user?.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.displayName || "U"
              )}&background=00c896&color=fff`
            }
            alt="avatar"
            className="profile-avatar"
          />
          <div>
            <p className="profile-name">{user?.displayName || "Usuario"}</p>
            <p className="profile-email">{user?.email}</p>
            <span className="badge" style={{ marginTop: 8, display: "inline-block" }}>
              Google OAuth
            </span>
          </div>
        </div>
      </div>

      {/* Opciones generales */}
      <div className="config-grid">
        <div className="card">
          <h3 className="card-title">
            <Globe size={18} /> Idioma
          </h3>
          <select className="field">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="card">
          <h3 className="card-title">
            <Settings size={18} /> Tema
          </h3>
          <select className="field">
            <option value="oscuro">Oscuro</option>
            <option value="claro">Claro (próximamente)</option>
          </select>
        </div>
        <div className="card">
          <h3 className="card-title">
            <Bell size={18} /> Alertas
          </h3>
          <select
            className="field"
            value={alertasActivadas ? "on" : "off"}
            onChange={(e) => updateAlertas(e.target.value)}
          >
            <option value="on">Activadas</option>
            <option value="off">Desactivadas</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
