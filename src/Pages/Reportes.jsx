import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#f85a5a", "#ff9f43", "#00c896", "#4b7bec", "#a55eea", 
  "#f368e0", "#ff6b6b", "#1dd1a1", "#54a0ff", "#5f27cd", "#feca57", "#8395a7"
];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

import { useAuth } from "../context/AuthContext";

const Reportes = () => {
  const { user } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "movimientos"), where("uid", "==", user.uid)),
      (snap) => {
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(m => m.fecha);
        docs.sort((a,b) => a.fecha.seconds - b.fecha.seconds);
        setMovimientos(docs);
      }
    );
    const unsubDeudas = onSnapshot(
      query(collection(db, "deudas"), where("uid", "==", user.uid)),
      (snap) => {
        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.fecha);
        setDeudas(docs);
      }
    );
    return () => { unsub(); unsubDeudas(); };
  }, [user.uid]);

  const filtrados = movimientos.filter((m) => {
    const f = new Date(m.fecha.seconds * 1000);
    return f.getMonth() === parseInt(mes) && f.getFullYear() === parseInt(anio);
  });

  const deudasFiltradas = deudas.filter((d) => {
    const f = new Date(d.fecha.seconds * 1000);
    return f.getMonth() === parseInt(mes) && f.getFullYear() === parseInt(anio);
  });

  const ingresos = filtrados.filter((m) => m.tipo === "Ingreso");
  const gastos   = filtrados.filter((m) => m.tipo === "Gasto");
  const totalI   = ingresos.reduce((a, m) => a + m.monto, 0);
  const totalG   = gastos.reduce((a, m) => a + m.monto, 0);
  
  const meDebenMes = deudasFiltradas.filter(d => d.tipo === "Me deben").reduce((a, d) => a + d.monto, 0);
  const deboMes    = deudasFiltradas.filter(d => d.tipo === "Debo").reduce((a, d) => a + d.monto, 0);

  const meDebenRestar = Math.max(0, meDebenMes - 16000);

  const balance  = (totalI - totalG) - meDebenRestar;

  const gastosPorCat = gastos.reduce((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] || 0) + m.monto;
    return acc;
  }, {});
  const datosPastel = Object.entries(gastosPorCat).map(([name, value]) => ({ name, value }));
  const topGastos = [...gastos].sort((a, b) => b.monto - a.monto).slice(0, 5);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reportes</h2>
          <p className="page-subtitle">Análisis financiero por período</p>
        </div>
        <div className="filter-row">
          <select className="field-sm" value={mes} onChange={(e) => setMes(e.target.value)}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="field-sm" value={anio} onChange={(e) => setAnio(e.target.value)}>
            {[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stat-grid">
        <div className="stat-card stat-green">
          <div>
            <p className="stat-label">Ingresos</p>
            <p className="stat-value">${totalI.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div>
            <p className="stat-label">Gastos</p>
            <p className="stat-value">${totalG.toLocaleString()}</p>
          </div>
        </div>
        <div className={`stat-card ${balance >= 0 ? "stat-green" : "stat-red"}`}>
          <div>
            <p className="stat-label">Balance Neto</p>
            <p className="stat-value">${balance.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Me Deben (Este Mes)</p>
            <p className="stat-value amount-green">${meDebenMes.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Nuevas Deudas Mías</p>
            <p className="stat-value amount-red">${deboMes.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {datosPastel.length > 0 && (
          <div className="card">
            <h3 className="card-title">Distribución por categoría</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={datosPastel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {datosPastel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend verticalAlign="bottom" />
                <Tooltip contentStyle={{ background: "#1e272e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} itemStyle={{ color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {topGastos.length > 0 && (
          <div className="card">
            <h3 className="card-title">Top 5 gastos</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  {topGastos.map((g) => (
                    <tr key={g.id}>
                      <td className="muted">{new Date(g.fecha.seconds * 1000).toLocaleDateString()}</td>
                      <td>{g.descripcion}</td>
                      <td><span className="badge">{g.categoria || "—"}</span></td>
                      <td className="amount-red">${g.monto.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {filtrados.length === 0 && (
        <div className="card">
          <p className="empty-state">No hay movimientos para {MESES[mes]} {anio}.</p>
        </div>
      )}
    </div>
  );
};

export default Reportes;
