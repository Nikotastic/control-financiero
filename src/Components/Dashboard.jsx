import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import AIInsights from "./AIInsights";
import EmailSummary from "./EmailSummary";

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="chart-tooltip-value">
            {p.name}: ${p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [datosArea, setDatosArea] = useState([]);
  const [datosPastel, setDatosPastel] = useState([
    { name: "Ingresos", value: 0 },
    { name: "Gastos", value: 0 },
  ]);
  const [kpis, setKpis] = useState({ totalIngresos: 0, totalGastos: 0, balance: 0, inversiones: 0 });

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "movimientos"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      datos.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setMovimientos(datos);

      const ingresos = datos.filter((m) => m.tipo === "Ingreso").reduce((a, m) => a + m.monto, 0);
      const gastos   = datos.filter((m) => m.tipo === "Gasto").reduce((a, m) => a + m.monto, 0);
      setKpis((prev) => ({ ...prev, totalIngresos: ingresos, totalGastos: gastos, balance: ingresos - gastos }));
      setDatosPastel([{ name: "Ingresos", value: ingresos }, { name: "Gastos", value: gastos }]);

      const porMes = {};
      const hoy = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const lbl = d.toLocaleString("es-ES", { month: "short", year: "2-digit" });
        porMes[key] = { key, label: lbl, Ingresos: 0, Gastos: 0 };
      }

      datos.forEach((m) => {
        if (!m.fecha) return;
        const f   = new Date(m.fecha.seconds * 1000);
        const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
        if (!porMes[key]) return; // Solo incluimos los ultimos 6 meses
        if (m.tipo === "Ingreso") porMes[key].Ingresos += m.monto;
        else porMes[key].Gastos += m.monto;
      });
      setDatosArea(Object.values(porMes).sort((a, b) => a.key.localeCompare(b.key)));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "inversiones"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const total = snap.docs.reduce((a, d) => a + (d.data().monto || 0), 0);
      setKpis((prev) => ({ ...prev, inversiones: total }));
    });
    return () => unsub();
  }, [user?.uid]);

  const recientes = movimientos.slice(0, 5);
  const firstName = user?.displayName?.split(" ")[0] || "Usuario";
  const pctGastos = kpis.totalIngresos > 0
    ? Math.min((kpis.totalGastos / kpis.totalIngresos) * 100, 100) : 0;
  const barColor = pctGastos >= 90 ? "#f85a5a" : pctGastos >= 70 ? "#ff9f43" : "#00c896";

  // Categoría con más gasto (para la IA)
  const gastosMap = {};
  movimientos.filter((m) => m.tipo === "Gasto" && m.categoria).forEach((m) => {
    gastosMap[m.categoria] = (gastosMap[m.categoria] || 0) + m.monto;
  });
  const categoriaTopGasto = Object.entries(gastosMap).sort((a, b) => b[1] - a[1])[0]?.[0];

  const financialData = {
    ingresos: kpis.totalIngresos,
    gastos: kpis.totalGastos,
    balance: kpis.balance,
    inversiones: kpis.inversiones,
    numMovimientos: movimientos.length,
    categoriaTopGasto,
    userName: user?.displayName || "Usuario",
  };

  return (
    <div className="dash-page">
      {/* ── Greeting + acciones rápidas ── */}
      <div className="dash-greeting">
        <div className="dash-greeting-left">
          <span className="dash-hello">{GREETING()}, <span className="dash-name">{firstName}</span></span>
          <p className="dash-date">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="dash-actions">
          <EmailSummary financialData={financialData} userEmail={user?.email || ""} />
          <div className="dash-health-pill">
            <span>Salud: </span>
            <strong style={{ color: barColor }}>
              {pctGastos >= 90 ? "Crítica" : pctGastos >= 70 ? "Regular" : "Buena"}
            </strong>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="dash-kpi-grid">
        <div className="kpi-card kpi-green">
          <div className="kpi-icon-wrap kpi-icon-green"><TrendingUp size={20} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Total Ingresos</p>
            <p className="kpi-value">${kpis.totalIngresos.toLocaleString()}</p>
          </div>
          <ArrowUpRight size={18} className="kpi-trend kpi-trend-green" />
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-icon-wrap kpi-icon-red"><TrendingDown size={20} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Total Gastos</p>
            <p className="kpi-value">${kpis.totalGastos.toLocaleString()}</p>
          </div>
          <ArrowDownRight size={18} className="kpi-trend kpi-trend-red" />
        </div>
        <div className={`kpi-card ${kpis.balance >= 0 ? "kpi-green" : "kpi-red"}`}>
          <div className={`kpi-icon-wrap ${kpis.balance >= 0 ? "kpi-icon-green" : "kpi-icon-red"}`}>
            <Wallet size={20} />
          </div>
          <div className="kpi-body">
            <p className="kpi-label">Balance Neto</p>
            <p className="kpi-value" style={{ color: kpis.balance >= 0 ? "var(--green)" : "var(--red)" }}>
              {kpis.balance >= 0 ? "+" : ""}${kpis.balance.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon-wrap kpi-icon-blue"><TrendingUp size={20} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Inversiones</p>
            <p className="kpi-value">${kpis.inversiones.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Barra de salud ── */}
      <div className="dash-health-bar-card">
        <div className="dash-health-header">
          <span className="card-title" style={{ margin: 0 }}>Ratio gastos / ingresos</span>
          <span className="dash-health-pct" style={{ color: barColor }}>{pctGastos.toFixed(0)}%</span>
        </div>
        <div className="progress-bar-bg" style={{ height: 10, marginTop: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${pctGastos}%`, background: barColor }} />
        </div>
        <p className="dash-health-hint">
          {pctGastos >= 90 ? " Gastos muy altos — revisa tus categorías de gasto."
            : pctGastos >= 70 ? " Gastos moderados — hay margen de mejora."
            : " Excelente — tus ingresos superan tus gastos cómodamente."}
        </p>
      </div>

      {/* ── Alertas + IA (fila lateral) ── */}
      <div className="dash-side-grid">
        <AIInsights financialData={financialData} />
      </div>

      {/* ── Gráficos ── */}
      <div className="dash-charts-grid">
        <div className="card">
          <h3 className="card-title">Evolución mensual</h3>
          {datosArea.length === 0 ? (
            <p className="empty-state">Sin datos históricos aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={datosArea} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c896" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f85a5a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f85a5a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Ingresos" stroke="#00c896" strokeWidth={2} fill="url(#gIngresos)" dot={false} />
                <Area type="monotone" dataKey="Gastos"   stroke="#f85a5a" strokeWidth={2} fill="url(#gGastos)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Distribución</h3>
          {datosPastel.every((d) => d.value === 0) ? (
            <p className="empty-state">Sin datos aún.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={datosPastel} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                    <Cell fill="#00c896" />
                    <Cell fill="#f85a5a" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                <div className="pie-legend-item">
                  <span className="pie-dot" style={{ background: "#00c896" }} />
                  <span>Ingresos</span>
                  <strong className="amount-green">${kpis.totalIngresos.toLocaleString()}</strong>
                </div>
                <div className="pie-legend-item">
                  <span className="pie-dot" style={{ background: "#f85a5a" }} />
                  <span>Gastos</span>
                  <strong className="amount-red">${kpis.totalGastos.toLocaleString()}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Actividad reciente ── */}
      <div className="card">
        <div className="dash-recent-header">
          <h3 className="card-title" style={{ margin: 0 }}>
            <Clock size={16} /> Actividad reciente
          </h3>
          <span className="muted" style={{ fontSize: "0.8rem" }}>Últimos {recientes.length} movimientos</span>
        </div>
        {recientes.length === 0 ? (
          <p className="empty-state">No hay movimientos registrados.</p>
        ) : (
          <div className="activity-list">
            {recientes.map((mov) => (
              <div key={mov.id} className="activity-item">
                <div className={`activity-dot ${mov.tipo === "Ingreso" ? "dot-green" : "dot-red"}`} />
                <div className="activity-info">
                  <p className="activity-desc">{mov.descripcion}</p>
                  <p className="activity-date">
                    {new Date(mov.fecha.seconds * 1000).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {mov.categoria && <span className="badge" style={{ marginLeft: 8 }}>{mov.categoria}</span>}
                  </p>
                </div>
                <div className="activity-right">
                  <span className={`activity-monto ${mov.tipo === "Ingreso" ? "amount-green" : "amount-red"}`}>
                    {mov.tipo === "Ingreso" ? "+" : "-"}${mov.monto.toLocaleString()}
                  </span>
                  <span className={`activity-tipo ${mov.tipo === "Ingreso" ? "tipo-ingreso" : "tipo-gasto"}`}>
                    {mov.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
