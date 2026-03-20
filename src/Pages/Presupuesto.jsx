import React, { useEffect, useState } from "react";
import {
  collection, doc, getDoc, setDoc, query, onSnapshot, where, addDoc, deleteDoc, updateDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { Target, Plus, Pencil, Trash2, X, Check } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const obtenerMesActual = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const CATEGORIAS = [
  "Vivienda", "Alimentación", "Transporte", "Servicios", "Salud", 
  "Educación", "Entretenimiento", "Ropa", "Deudas", "Ahorro", "Seguros", "Otros"
];

export default function Presupuesto() {
  const { user } = useAuth();
  const [montoPresupuesto, setMontoPresupuesto] = useState("");
  const [presupuestoActual, setPresupuestoActual] = useState(null);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [categoria, setCategoria] = useState("Vivienda");
  const [montoCategoria, setMontoCategoria] = useState("");
  const [presupuestosCategoria, setPresupuestosCategoria] = useState([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editMontoCategoria, setEditMontoCategoria] = useState("");
  const mesActual = obtenerMesActual();

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "presupuesto", `${user.uid}_${mesActual}`)).then((snap) => {
      if (snap.exists()) setPresupuestoActual(snap.data().monto);
    });
  }, [mesActual, user.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(query(collection(db, "movimientos"), where("uid", "==", user.uid)), (snap) => {
      const movs = snap.docs.map((d) => d.data()).filter((m) => {
        if (!m.fecha || !m.tipo) return false;
        const f = new Date(m.fecha.seconds * 1000);
        return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === mesActual;
      });
      setTotalIngresos(movs.filter((m) => m.tipo === "Ingreso").reduce((a, m) => a + m.monto, 0));
      setTotalGastos(movs.filter((m) => m.tipo === "Gasto").reduce((a, m) => a + m.monto, 0));
      const agr = {};
      movs.forEach((m) => { if (m.tipo === "Gasto" && m.categoria) agr[m.categoria] = (agr[m.categoria] || 0) + m.monto; });
      setGastosPorCategoria(agr);
    });
    return () => unsub();
  }, [mesActual, user.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(query(collection(db, "presupuestos_categoria"), where("uid", "==", user.uid)), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPresupuestosCategoria(all.filter((item) => item.mes === mesActual));
    });
    return () => unsub();
  }, [mesActual, user.uid]);

  const guardarPresupuesto = async () => {
    if (!montoPresupuesto || isNaN(montoPresupuesto)) return;
    const monto = parseFloat(montoPresupuesto);
    await setDoc(doc(db, "presupuesto", `${user.uid}_${mesActual}`), { monto, uid: user.uid });
    setPresupuestoActual(monto);
    setMensaje("Presupuesto guardado");
    setTimeout(() => setMensaje(""), 2500);
    setMontoPresupuesto("");
  };

  const eliminarPresupuesto = async () => {
    try {
      await deleteDoc(doc(db, "presupuesto", `${user.uid}_${mesActual}`));
      setPresupuestoActual(null);
      setMensaje("Presupuesto eliminado");
      setTimeout(() => setMensaje(""), 2500);
    } catch (e) { console.error(e); }
  };

  const agregarPresupuestoCategoria = async () => {
    if (!montoCategoria || isNaN(montoCategoria)) return;
    await addDoc(collection(db, "presupuestos_categoria"), {
      mes: mesActual, categoria, monto: parseFloat(montoCategoria), uid: user.uid,
    });
    setMontoCategoria("");
  };

  const eliminarPresupuestoCategoria = async (id) => {
    try { await deleteDoc(doc(db, "presupuestos_categoria", id)); }
    catch (e) { console.error(e); }
  };

  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setEditMontoCategoria(item.monto);
  };

  const guardarEdicion = async (id) => {
    if (!editMontoCategoria || isNaN(editMontoCategoria)) return;
    try {
      await updateDoc(doc(db, "presupuestos_categoria", id), {
        monto: parseFloat(editMontoCategoria)
      });
      setEditandoId(null);
    } catch (e) { console.error(e); }
  };

  const usado = totalGastos;
  let pct = 0;
  if (presupuestoActual > 0) {
    pct = Math.min((usado / presupuestoActual) * 100, 100);
  } else if (usado > 0) {
    pct = 100; // Si no hay presupuesto (0) pero ya hay gastos, estás excedido.
  }

  const barColor = pct >= 100 ? "var(--red)" : pct >= 80 ? "var(--orange)" : "var(--green)";

  let estadoText = "";
  if (presupuestoActual === null || presupuestoActual === 0) {
    estadoText = usado > 0 ? `Gastaste $${usado} sin un presupuesto.` : "Ingresa un presupuesto para empezar";
  } else if (usado > presupuestoActual) {
    estadoText = `Excedido por $${(usado - presupuestoActual).toFixed(2)}`;
  } else if (usado === presupuestoActual) {
    estadoText = "Presupuesto agotado ($0.00 disponible)";
  } else if (pct >= 80) {
    estadoText = `Alerta: ${(pct).toFixed(0)}% del presupuesto usado`;
  } else {
    estadoText = `Disponible: $${(presupuestoActual - usado).toFixed(2)}`;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Presupuesto</h2>
          <p className="page-subtitle">Gestiona tu presupuesto mensual — {mesActual}</p>
        </div>
      </div>

      <div className="presupuesto-grid">
        {/* Presupuesto general */}
        <div className="card">
          <h3 className="card-title"><Target size={18} /> Presupuesto mensual</h3>
          <div className="form-stack">
            <input className="field" type="number" placeholder="Monto mensual ($)" value={montoPresupuesto} onChange={(e) => setMontoPresupuesto(e.target.value)} />
            <button className="btn-primary" onClick={guardarPresupuesto}>Guardar</button>
            {presupuestoActual !== null && (
              <button className="btn-icon-danger" onClick={eliminarPresupuesto} title="Quitar presupuesto mensual">
                <Trash2 size={16} /> Quitar presupuesto
              </button>
            )}
            {mensaje && <p className={mensaje.includes("eliminado") ? "msg-error" : "msg-success"}>{mensaje}</p>}
          </div>

          {presupuestoActual !== null && (
            <div className="budget-status">
              <div className="budget-stats">
                <span>Ingresos: <strong className="amount-green">${totalIngresos.toLocaleString()}</strong></span>
                <span>Gastos: <strong className="amount-red">${totalGastos.toLocaleString()}</strong></span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <p className="budget-estado" style={{ color: barColor }}>{estadoText}</p>
              <p className="budget-pct">{pct.toFixed(0)}% del presupuesto utilizado</p>
            </div>
          )}
        </div>

        {/* Presupuesto por categoría */}
        <div className="card">
          <h3 className="card-title"><Plus size={18} /> Por categoría</h3>
          <div className="form-row">
            <select className="field" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="field" type="number" placeholder="Monto ($)" value={montoCategoria} onChange={(e) => setMontoCategoria(e.target.value)} />
            <button className="btn-primary" onClick={agregarPresupuestoCategoria}>Agregar</button>
          </div>

          <div className="category-list">
            {presupuestosCategoria.length === 0 && <p className="empty-state">Sin categorías definidas.</p>}
            {presupuestosCategoria.map((item) => {
              const gasto = gastosPorCategoria[item.categoria] || 0;
              const p = Math.min((gasto / item.monto) * 100, 100);
              const c = p >= 100 ? "#f85a5a" : p >= 80 ? "#ff9f43" : "#00c896";
              return (
                <div key={item.id} className="category-item" style={{ marginBottom: "1rem", position: "relative" }}>
                  <div className="category-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{item.categoria}</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {editandoId === item.id ? (
                        <div style={{ display: "flex", gap: "5px" }}>
                          <input 
                            type="number" 
                            className="field-sm" 
                            style={{ width: "80px", padding: "2px 4px" }}
                            value={editMontoCategoria}
                            onChange={(e) => setEditMontoCategoria(e.target.value)}
                          />
                          <button className="btn-icon text-green" onClick={() => guardarEdicion(item.id)}><Check size={14} /></button>
                          <button className="btn-icon" onClick={() => setEditandoId(null)}><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="muted">${gasto.toFixed(0)} / ${item.monto}</span>
                          <button className="btn-icon text-blue" onClick={() => iniciarEdicion(item)}><Pencil size={14} /></button>
                          <button className="btn-icon text-red" onClick={() => eliminarPresupuestoCategoria(item.id)}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${p}%`, background: c }} />
                  </div>
                  <p className="category-resto" style={{ color: c }}>
                    {gasto < item.monto 
                      ? `Disponible: $${(item.monto - gasto).toFixed(0)}` 
                      : gasto === item.monto 
                      ? "Agotado ($0 disp.)"
                      : `Excedido: $${(gasto - item.monto).toFixed(0)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
