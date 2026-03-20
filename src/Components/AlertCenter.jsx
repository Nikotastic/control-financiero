import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAlerts } from "../hooks/useAlerts";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";

const TYPE_STYLES = {
  critical: { border: "var(--red)",    bg: "rgba(248,90,90,0.08)",  badgeBg: "rgba(248,90,90,0.15)",  badgeColor: "var(--red)" },
  warning:  { border: "var(--orange)", bg: "rgba(255,159,67,0.07)", badgeBg: "rgba(255,159,67,0.15)", badgeColor: "var(--orange)" },
  info:     { border: "var(--blue)",   bg: "rgba(75,123,236,0.07)", badgeBg: "rgba(75,123,236,0.15)", badgeColor: "var(--blue)" },
  success:  { border: "var(--green)",  bg: "rgba(0,200,150,0.07)",  badgeBg: "rgba(0,200,150,0.15)",  badgeColor: "var(--green)" },
};

const TYPE_LABEL = {
  critical: "Crítica",
  warning:  "Aviso",
  info:     "Info",
  success:  "Bien",
};

// Genera una "firma" de la lista de alertas actuales (basada en sus IDs)
const firmaAlertas = (alerts) => alerts.map((a) => a.id).sort().join("|");

const getLastSeenKey = (uid) => `notif_seen_${uid}`;

export default function AlertCenter() {
  const { user } = useAuth();
  const { alertasActivadas } = useSettings(user?.uid);
  const alerts = useAlerts(alertasActivadas ? user : null);
  const [open, setOpen] = useState(false);
  const [pagina, setPagina] = useState(1);
  // "firma" de las alertas que el usuario ya vio
  const [firmaVista, setFirmaVista] = useState(() =>
    localStorage.getItem(getLastSeenKey(user?.uid)) || ""
  );
  const POR_PAGINA = 4;
  const ref = useRef(null);

  // Sincronizar si cambia el usuario
  useEffect(() => {
    setFirmaVista(localStorage.getItem(getLastSeenKey(user?.uid)) || "");
  }, [user?.uid]);

  const firmaActual = firmaAlertas(alerts);
  // Hay alertas nuevas si la firma actual es diferente a la última vista
  const hayNuevas = firmaActual !== firmaVista && alerts.length > 0;

  const criticals = alerts.filter((a) => a.tipo === "critical").length;
  const totalPaginas = Math.ceil(alerts.length / POR_PAGINA);
  const alertasPagina = alerts.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // Al abrir el panel → marcar como vistas (guardar firma actual)
  const handleOpen = useCallback(() => {
    setOpen((o) => {
      if (!o) {
        // Usuario abre el panel: registrar firma actual como "vista"
        localStorage.setItem(getLastSeenKey(user?.uid), firmaActual);
        setFirmaVista(firmaActual);
      } else {
        setPagina(1);
      }
      return !o;
    });
  }, [user?.uid, firmaActual]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setPagina(1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!alertasActivadas) return null;

  return (
    <div className="notif-wrapper" ref={ref}>
      {/* Botón campana */}
      <button className="notif-btn" onClick={handleOpen} aria-label="Notificaciones">
        <Bell size={20} />
        {/* Burbuja solo si hay alertas NUEVAS (situación cambió desde la última vez) */}
        {hayNuevas && (
          <span className={`notif-dot ${criticals > 0 ? "notif-dot--red" : "notif-dot--orange"}`}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel animate-fade-in">
          <div className="notif-panel-header">
            <span>Notificaciones</span>
            <button className="notif-close-btn" onClick={() => { setOpen(false); setPagina(1); }}>
              <X size={15} />
            </button>
          </div>

          <div className="notif-list">
            {alerts.length === 0 ? (
              <p className="notif-empty">Sin alertas por ahora.</p>
            ) : (
              alertasPagina.map((alert) => {
                const s = TYPE_STYLES[alert.tipo] || TYPE_STYLES.info;
                return (
                  <div
                    key={alert.id}
                    className="notif-item"
                    style={{ borderLeft: `3px solid ${s.border}`, background: s.bg }}
                  >
                    <div className="notif-item-top">
                      <span className="notif-icon">{alert.icono}</span>
                      <div className="notif-item-body">
                        <div className="notif-item-head">
                          <p className="notif-item-title">{alert.titulo}</p>
                          <span
                            className="notif-type-badge"
                            style={{ background: s.badgeBg, color: s.badgeColor }}
                          >
                            {TYPE_LABEL[alert.tipo]}
                          </span>
                        </div>
                        <p className="notif-item-msg">{alert.mensaje}</p>
                      </div>
                    </div>
                    {alert.accion && (
                      <Link
                        to={alert.accion}
                        className="notif-action-link"
                        onClick={() => { setOpen(false); setPagina(1); }}
                      >
                        {alert.accionLabel} →
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="notif-pagination">
              <button
                className="notif-page-btn"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
              >‹</button>
              <span className="notif-page-label">{pagina} / {totalPaginas}</span>
              <button
                className="notif-page-btn"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
              >›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
