import React, { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where, orderBy,
  addDoc, deleteDoc, updateDoc, doc, Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Plus, Pencil, Trash2, X, Check, HandCoins } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const CATEGORIAS = [
  "Vivienda", "Alimentación", "Transporte", "Servicios", "Salud", 
  "Educación", "Entretenimiento", "Ropa", "Deudas", "Ahorro", "Seguros", "Otros"
];
const COLORS = [
  "#f85a5a", "#ff9f43", "#00c896", "#4b7bec", "#a55eea", 
  "#f368e0", "#ff6b6b", "#1dd1a1", "#54a0ff", "#5f27cd", "#feca57", "#8395a7"
];

const Gastos = () => {
  const { user } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Vivienda");
  const [editandoId, setEditandoId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editCategoria, setEditCategoria] = useState("Vivienda");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "movimientos"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const gastosFiltered = data
        .filter((d) => d.tipo === "Gasto" && d.fecha)
        .sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setGastos(gastosFiltered);
    });
    return () => unsub();
  }, [user?.uid]);

  const total = gastos.reduce((acc, g) => acc + g.monto, 0);

  const agregarGasto = async () => {
    if (!descripcion || !monto) return;
    try {
      await addDoc(collection(db, "movimientos"), {
        descripcion, monto: parseFloat(monto), tipo: "Gasto", categoria,
        fecha: Timestamp.fromDate(new Date()),
        uid: user.uid,
      });
      setDescripcion(""); setMonto(""); setMostrarForm(false);
    } catch (e) { console.error(e); }
  };

  const guardarEdicion = async (id) => {
    try {
      await updateDoc(doc(db, "movimientos", id), {
        descripcion: editDescripcion, monto: parseFloat(editMonto), categoria: editCategoria,
      });
      setEditandoId(null);
    } catch (e) { console.error(e); }
  };

  const eliminarGasto = async (id) => {
    try { await deleteDoc(doc(db, "movimientos", id)); }
    catch (e) { console.error(e); }
  };

  const datosPastel = CATEGORIAS.map((cat) => ({
    name: cat,
    value: gastos.filter((g) => g.categoria === cat).reduce((acc, g) => acc + g.monto, 0),
  })).filter((d) => d.value > 0);

  const datosBarras = (() => {
    const agr = {};
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const fKey = d.toLocaleDateString();
      agr[fKey] = { fecha: fKey, monto: 0, sortVal: d.getTime() };
    }

    gastos.forEach((g) => {
      if (!g.fecha) return;
      const fecha = new Date(g.fecha.seconds * 1000).toLocaleDateString();
      if (agr[fecha]) agr[fecha].monto += g.monto;
    });
    return Object.values(agr).sort((a, b) => a.sortVal - b.sortVal);
  })();

  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const gastosPaginados = gastos.slice(indicePrimer, indiceUltimo);
  const totalPaginas = Math.ceil(gastos.length / itemsPorPagina);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gastos</h2>
          <p className="page-subtitle">Controla en dónde se va tu dinero</p>
        </div>
        <button className="btn-danger" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus size={18} /> Nuevo gasto
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-red">
          <HandCoins size={22} />
          <div>
            <p className="stat-label">Total gastos</p>
            <p className="stat-value">${total.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Registros</p>
            <p className="stat-value">{gastos.length}</p>
          </div>
        </div>
      </div>

      {mostrarForm && (
        <div className="card form-card animate-fade-in">
          <h3 className="card-title">Agregar gasto</h3>
          <div className="form-row">
            <input className="field" type="text" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <input className="field" type="number" placeholder="Monto ($)" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <select className="field" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-danger" onClick={agregarGasto}>Guardar</button>
            <button className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="charts-grid">
        {datosPastel.length > 0 && (
          <div className="card">
            <h3 className="card-title">Por categoría</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={datosPastel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {datosPastel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend verticalAlign="bottom" />
                <Tooltip contentStyle={{ background: "#1e272e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} itemStyle={{ color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {datosBarras.length > 0 && (
          <div className="card">
            <h3 className="card-title">Por día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fecha" tick={{ fill: "#8b949e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1e272e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} itemStyle={{ color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="monto" fill="#f85a5a" name="Gasto ($)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="card">
        <h3 className="card-title">Historial</h3>
        {gastos.length === 0 ? (
          <p className="empty-state">No hay gastos registrados aún.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {gastosPaginados.map((g) => (
                  <tr key={g.id}>
                    <td className="muted">{new Date(g.fecha.seconds * 1000).toLocaleDateString()}</td>
                    {editandoId === g.id ? (
                      <>
                        <td><input className="field-inline" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} /></td>
                        <td><select className="field-inline" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></td>
                        <td><input className="field-inline" type="number" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></td>
                        <td><div className="action-btns">
                          <button className="icon-btn green" onClick={() => guardarEdicion(g.id)}><Check size={15}/></button>
                          <button className="icon-btn ghost" onClick={() => setEditandoId(null)}><X size={15}/></button>
                        </div></td>
                      </>
                    ) : (
                      <>
                        <td>{g.descripcion}</td>
                        <td><span className="badge">{g.categoria || "Sin categoría"}</span></td>
                        <td className="amount-red">${g.monto.toLocaleString()}</td>
                        <td><div className="action-btns">
                          <button className="icon-btn blue" onClick={() => { setEditandoId(g.id); setEditDescripcion(g.descripcion); setEditMonto(g.monto); setEditCategoria(g.categoria || "Vivienda"); }}><Pencil size={15}/></button>
                          <button className="icon-btn red" onClick={() => eliminarGasto(g.id)}><Trash2 size={15}/></button>
                        </div></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Controles de paginación */}
            {totalPaginas > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "1rem", alignItems: "center" }}>
                <button 
                  className="btn-ghost" 
                  disabled={paginaActual === 1} 
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                >Anterior</button>
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button 
                  className="btn-ghost" 
                  disabled={paginaActual === totalPaginas} 
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                >Siguiente</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gastos;
