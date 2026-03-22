import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Clock, Users, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
  const [inversionesData, setInversionesData] = useState([]);
  const [deudasData, setDeudasData] = useState([]);
  const [datosPastel, setDatosPastel] = useState([]);
  const [kpis, setKpis] = useState({ totalIngresos: 0, totalGastos: 0, balance: 0, inversiones: 0, meDeben: 0, debo: 0 });
  const [paginaActualRecientes, setPaginaActualRecientes] = useState(1);

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
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "inversiones"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const total = data.reduce((a, d) => a + (d.monto || 0), 0);
      setInversionesData(data);
      setKpis((prev) => ({ ...prev, inversiones: total }));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "deudas"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const meDeben = data.filter(d => d.tipo === "Me deben" && !d.pagado).reduce((a, d) => a + d.monto, 0);
      const debo = data.filter(d => d.tipo === "Debo" && !d.pagado).reduce((a, d) => a + d.monto, 0);
      setDeudasData(data);
      setKpis((prev) => ({ ...prev, meDeben, debo }));
    });
    return () => unsub();
  }, [user?.uid]);

  const allEvents = [
    ...movimientos.map(m => ({ ...m, _module: "mov", tipoDesc: m.tipo, badge: m.categoria, tipoMonto: m.tipo })),
    ...inversionesData.map(i => ({ ...i, _module: "inv", tipoDesc: "Inversión", badge: i.tipo, descripcion: `Inv: ${i.nombre}`, tipoMonto: "Gasto" })),
    ...deudasData.map(d => ({ ...d, _module: "deuda", tipoDesc: d.tipo === "Me deben" ? "Préstamo" : "Nueva Deuda", badge: "Personal", descripcion: `Préstamo: ${d.persona}`, tipoMonto: d.tipo === "Me deben" ? "Gasto" : "Ingreso" }))
  ].filter(e => e.fecha).sort((a,b) => b.fecha.seconds - a.fecha.seconds);

  const ITEMS_POR_PAGINA = 5;
  const totalPaginasRecientes = Math.max(1, Math.ceil(allEvents.length / ITEMS_POR_PAGINA));
  const recientes = allEvents.slice(
    (paginaActualRecientes - 1) * ITEMS_POR_PAGINA,
    paginaActualRecientes * ITEMS_POR_PAGINA
  );

  const porMes = {};
  const hoy = new Date();
  for (let i = 5; i >= 0; i--) {
     const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
     const lbl = d.toLocaleString("es-ES", { month: "short", year: "2-digit" });
     porMes[key] = { key, label: lbl, Ingresos: 0, Gastos: 0, Inversiones: 0, Préstamos: 0, Deudas: 0 };
  }
  allEvents.forEach(e => {
    const f = new Date(e.fecha.seconds * 1000);
    const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    if (!porMes[key]) return;
    if (e._module === "mov") {
       if (e.tipo === "Ingreso") porMes[key].Ingresos += e.monto;
       else porMes[key].Gastos += e.monto;
    } else if (e._module === "inv") {
       porMes[key].Inversiones += e.monto;
    } else if (e._module === "deuda") {
       if (e.tipo === "Me deben") porMes[key].Préstamos += e.monto;
       else porMes[key].Deudas += e.monto;
    }
  });
  const datosAreaCalc = Object.values(porMes).sort((a, b) => a.key.localeCompare(b.key));

  const firstName = user?.displayName?.split(" ")[0] || "Usuario";
  const pctGastos = kpis.totalIngresos > 0
    ? Math.min((kpis.totalGastos / kpis.totalIngresos) * 100, 100) : 0;
  const barColor = pctGastos >= 90 ? "#f85a5a" : pctGastos >= 70 ? "#ff9f43" : "#00c896";

  const datosPastelMerge = [
    { name: "Ingresos", value: kpis.totalIngresos, color: "#00c896" },
    { name: "Gastos", value: kpis.totalGastos, color: "#f85a5a" },
    { name: "Inversiones", value: kpis.inversiones, color: "#a55eea" },
    { name: "Me deben", value: kpis.meDeben || 0, color: "#54a0ff" },
    { name: "Deudas", value: kpis.debo || 0, color: "#ff9f43" },
  ].filter(d => d.value > 0);

  // Categoría con más gasto (para la IA)
  const gastosMap = {};
  movimientos.filter((m) => m.tipo === "Gasto" && m.categoria).forEach((m) => {
    gastosMap[m.categoria] = (gastosMap[m.categoria] || 0) + m.monto;
  });
  const categoriaTopGasto = Object.entries(gastosMap).sort((a, b) => b[1] - a[1])[0]?.[0];

  const deduccionDeudas = Math.max(0, (kpis.meDeben || 0) - 16000);
  const balanceNeto = (kpis.totalIngresos - kpis.totalGastos) - deduccionDeudas;

  // Proyección y Score
  const dM = new Date();
  const diasTranscurridos = dM.getDate();
  const diasEnMes = new Date(dM.getFullYear(), dM.getMonth() + 1, 0).getDate();
  const gastoPromedioDiario = diasTranscurridos > 0 ? kpis.totalGastos / diasTranscurridos : 0;
  const proyeccionMes = gastoPromedioDiario * diasEnMes;
  const excesoProyectado = Math.max(0, proyeccionMes - kpis.totalIngresos);

  const gastoOcio = gastosMap["Ocio"] || 0;
  const gastoAhorro = gastosMap["Ahorro"] || 0;

  let score = 100;
  if (excesoProyectado > 0) score -= 20;
  if (kpis.debo > balanceNeto) score -= 30;
  if (kpis.totalIngresos > 0) {
    const tasaAhorro = (gastoAhorro + kpis.inversiones) / kpis.totalIngresos;
    if (tasaAhorro >= 0.20) score += 10;
    else if (tasaAhorro === 0) score -= 15;
    const tasaOcio = gastoOcio / kpis.totalIngresos;
    if (tasaOcio > 0.25) score -= 15;
  }
  score = Math.min(100, Math.max(0, score));
  const scoreColor = score >= 85 ? "var(--green)" : score >= 50 ? "var(--orange)" : "var(--red)";

  const financialData = {
    ingresos: kpis.totalIngresos,
    gastos: kpis.totalGastos,
    balance: balanceNeto,
    inversiones: kpis.inversiones,
    meDeben: kpis.meDeben,
    debo: kpis.debo,
    numMovimientos: movimientos.length,
    categoriaTopGasto,
    userName: user?.displayName || "Usuario",
    proyeccionMes,
    gastoOcio,
    gastoAhorro,
    score
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
        <div className={`kpi-card ${balanceNeto >= 0 ? "kpi-green" : "kpi-red"}`}>
          <div className={`kpi-icon-wrap ${balanceNeto >= 0 ? "kpi-icon-green" : "kpi-icon-red"}`}>
            <Wallet size={20} />
          </div>
          <div className="kpi-body">
            <p className="kpi-label">Balance Neto</p>
            <p className="kpi-value" style={{ color: balanceNeto >= 0 ? "var(--green)" : "var(--red)" }}>
              {balanceNeto >= 0 ? "+" : ""}${balanceNeto.toLocaleString()}
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
        <div className="kpi-card kpi-green">
          <div className="kpi-icon-wrap kpi-icon-green"><Users size={20} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Me deben</p>
            <p className="kpi-value">${(kpis.meDeben || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-icon-wrap kpi-icon-red"><Users size={20} /></div>
          <div className="kpi-body">
            <p className="kpi-label">Deudas (Debo)</p>
            <p className="kpi-value">${(kpis.debo || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Predicción y Score Financiero ── */}
      <div className="dash-charts-grid" style={{ marginBottom: "1rem" }}>
        {/* SCORE */}
        <div className="dash-health-bar-card" style={{ flex: 1 }}>
          <div className="dash-health-header" style={{ marginBottom: "0.5rem" }}>
            <span className="card-title" style={{ margin: 0 }}>Score Financiero</span>
            <span className="dash-health-pct" style={{ color: scoreColor }}>{score} / 100</span>
          </div>
          <div className="progress-bar-bg" style={{ height: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <p className="dash-health-hint" style={{ marginTop: "10px" }}>
            {score >= 85 ? "🟢 Finanzas Nivel Dios. Administras perfecto." : score >= 50 ? "🟠 Regular. Puedes optimizar tu dinero." : "🔴 Peligro: Finanzas en riesgo."}
          </p>
        </div>

        {/* PROYECCION */}
        <div className="dash-health-bar-card" style={{ flex: 1 }}>
          <div className="dash-health-header" style={{ marginBottom: "0.5rem" }}>
            <span className="card-title" style={{ margin: 0 }}>Proyección al fin de mes</span>
            <span className="dash-health-pct" style={{ color: excesoProyectado > 0 ? "var(--red)" : "var(--green)" }}>
              {excesoProyectado > 0 ? " En sobregiro" : " Buen ritmo"}
            </span>
          </div>
          <p className="dash-health-hint" style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-color)" }}>
            A este ritmo gastarás <strong>${proyeccionMes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> este mes.
          </p>
          <p className="dash-health-hint" style={{ marginTop: "5px", fontSize: "0.85rem", color: excesoProyectado > 0 ? "var(--red)" : "var(--green)" }}>
            {excesoProyectado > 0 ? ` Proyectas rebasar tus ingresos por $${excesoProyectado.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "Terminarás el mes por debajo de tus ingresos."}
          </p>
        </div>
      </div>

      {/* ── Alertas + IA (fila lateral) ── */}
      <div className="dash-side-grid">
        {kpis.debo > balanceNeto && (
          <div className="ai-card" style={{ borderColor: 'var(--red)', background: 'rgba(248, 90, 90, 0.05)' }}>
            <div className="ai-card-header" style={{ borderBottomColor: 'rgba(248, 90, 90, 0.1)' }}>
               <div className="ai-title"><AlertTriangle size={18} color="var(--red)"/> <strong style={{color: 'var(--red)'}}>Alerta Crítica de Deuda</strong></div>
            </div>
            <div className="ai-body">
              <p className="ai-insight-text" style={{ color: 'var(--red)' }}>
                Tus deudas (<strong>${(kpis.debo || 0).toLocaleString()}</strong>) superan toda tu plata actual disponible (<strong>${balanceNeto.toLocaleString()}</strong>). Estás prestado por encima de tu capacidad de pago inmediata. ¡Cuidado!
              </p>
            </div>
          </div>
        )}
        <AIInsights financialData={financialData} />
      </div>

      {/* ── Gráficos ── */}
      <div className="dash-charts-grid">
        <div className="card">
          <h3 className="card-title">Evolución mensual</h3>
          {datosAreaCalc.length === 0 ? (
            <p className="empty-state">Sin datos históricos aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={datosAreaCalc} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c896" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f85a5a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f85a5a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInversiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a55eea" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a55eea" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPrestamos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#54a0ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#54a0ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeudas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff9f43" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff9f43" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Ingresos" stroke="#00c896" strokeWidth={2} fill="url(#gIngresos)" dot={false} />
                <Area type="monotone" dataKey="Gastos"   stroke="#f85a5a" strokeWidth={2} fill="url(#gGastos)"   dot={false} />
                <Area type="monotone" dataKey="Inversiones"   stroke="#a55eea" strokeWidth={2} fill="url(#gInversiones)"   dot={false} />
                <Area type="monotone" dataKey="Préstamos"   stroke="#54a0ff" strokeWidth={2} fill="url(#gPrestamos)"   dot={false} />
                <Area type="monotone" dataKey="Deudas"   stroke="#ff9f43" strokeWidth={2} fill="url(#gDeudas)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Composición General</h3>
          {datosPastelMerge.length === 0 ? (
            <p className="empty-state">Sin datos aún.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={datosPastelMerge} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                    {datosPastelMerge.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "1rem" }}>
                {datosPastelMerge.map((d, i) => (
                  <div key={i} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: d.color }} />
                    <span style={{ fontSize: "0.85rem" }}>{d.name}</span>
                    <strong style={{ fontSize: "0.85rem", marginLeft: "4px" }}>${d.value.toLocaleString()}</strong>
                  </div>
                ))}
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
          <span className="muted" style={{ fontSize: "0.8rem" }}>{allEvents.length} movimientos en total</span>
        </div>
        {recientes.length === 0 ? (
          <p className="empty-state">No hay movimientos registrados.</p>
        ) : (
          <div className="activity-list">
            {recientes.map((mov) => (
              <div key={mov.id} className="activity-item">
                <div className={`activity-dot ${mov.tipoMonto === "Ingreso" ? "dot-green" : "dot-red"}`} />
                <div className="activity-info">
                  <p className="activity-desc">{mov.descripcion}</p>
                  <p className="activity-date">
                    {new Date(mov.fecha.seconds * 1000).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {mov.badge && <span className="badge" style={{ marginLeft: 8 }}>{mov.badge}</span>}
                  </p>
                </div>
                <div className="activity-right">
                  <span className={`activity-monto ${mov.tipoMonto === "Ingreso" ? "amount-green" : "amount-red"}`}>
                    {mov.tipoMonto === "Ingreso" ? "+" : "-"}${mov.monto.toLocaleString()}
                  </span>
                  <span className={`activity-tipo ${mov.tipoMonto === "Ingreso" ? "tipo-ingreso" : "tipo-gasto"}`}>
                    {mov.tipoDesc}
                  </span>
                </div>
              </div>
            ))}
            
            {totalPaginasRecientes > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "1rem", alignItems: "center" }}>
                <button 
                  className="icon-btn ghost" 
                  disabled={paginaActualRecientes === 1} 
                  onClick={() => setPaginaActualRecientes(prev => Math.max(prev - 1, 1))}
                  title="Anterior"
                ><ChevronLeft size={16} /></button>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {paginaActualRecientes} / {totalPaginasRecientes}
                </span>
                <button 
                  className="icon-btn ghost" 
                  disabled={paginaActualRecientes === totalPaginasRecientes} 
                  onClick={() => setPaginaActualRecientes(prev => Math.min(prev + 1, totalPaginasRecientes))}
                  title="Siguiente"
                ><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
