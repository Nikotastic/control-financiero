import React, { useEffect, useState } from "react";
import {
  collection, onSnapshot, query, where, orderBy,
  deleteDoc, doc, updateDoc, addDoc, Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Plus, Pencil, Trash2, X, Check, TrendingUp } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../Components/ToastProvider";

const CATEGORIAS_INGRESOS = ["Salario", "Negocio", "Inversiones", "Ventas", "Regalos", "Otros"];
const COLORS = ["#00c896", "#4b7bec", "#a55eea", "#feca57", "#ff9f43", "#8395a7"];

const Ingresos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ingresos, setIngresos] = useState([]);
  const [total, setTotal] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("Salario");
  const [editCategoria, setEditCategoria] = useState("Salario");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "movimientos"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.tipo === "Ingreso" && d.fecha)
        .sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setIngresos(datos);
      setTotal(datos.reduce((acc, m) => acc + m.monto, 0));
      const agrupados = {};
      const hoy = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(d.getDate() - i);
        const fKey = d.toLocaleDateString();
        agrupados[fKey] = { fecha: fKey, monto: 0, sortVal: d.getTime() };
      }

      datos.forEach((mov) => {
        const fechaStr = new Date(mov.fecha.seconds * 1000).toLocaleDateString();
        // Solo metemos datos si caen dentro de los últimos 7 días (o los agrupamos, si quitas el if)
        if (agrupados[fechaStr]) agrupados[fechaStr].monto += mov.monto;
      });
      setDatosGrafico(Object.values(agrupados).sort((a, b) => a.sortVal - b.sortVal));
    });
    return () => unsub();
  }, [user?.uid]);

  const agregarIngreso = async () => {
    if (!nuevaDescripcion || !nuevoMonto) {
      toast("Completa todos los campos del ingreso", "warning");
      return;
    }
    const valMonto = parseFloat(nuevoMonto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El ingreso debe ser un valor positivo mayor a 0", "error");
      return;
    }

    try {
      await addDoc(collection(db, "movimientos"), {
        descripcion: nuevaDescripcion,
        monto: valMonto,
        categoria: nuevaCategoria,
        tipo: "Ingreso",
        fecha: Timestamp.fromDate(new Date()),
        uid: user.uid,
      });
      toast("Ingreso registrado exitosamente", "success");
      setNuevaDescripcion("");
      setNuevoMonto("");
      setMostrarForm(false);
    } catch (e) {
      console.error(e);
      toast("Error al guardar el ingreso", "error");
    }
  };

  const guardarEdicion = async (id) => {
    if (!editDescripcion || !editMonto) {
      toast("Completa todos los campos de edición", "warning");
      return;
    }
    const valMonto = parseFloat(editMonto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El monto a editar debe ser mayor a 0", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "movimientos", id), {
        descripcion: editDescripcion,
        monto: valMonto,
        categoria: editCategoria,
      });
      toast("Ingreso actualizado", "success");
      setEditandoId(null);
    } catch (e) {
      console.error(e);
      toast("No se pudo actualizar el ingreso", "error");
    }
  };

  const eliminarIngreso = async (id) => {
    try { await deleteDoc(doc(db, "movimientos", id)); }
    catch (e) { console.error(e); }
  };

  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const ingresosPaginados = ingresos.slice(indicePrimer, indiceUltimo);
  const totalPaginas = Math.ceil(ingresos.length / itemsPorPagina);

  const datosPastel = CATEGORIAS_INGRESOS.map((cat) => ({
    name: cat,
    value: ingresos.filter((g) => g.categoria === cat).reduce((acc, g) => acc + g.monto, 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="page-content">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Ingresos</h2>
          <p className="page-subtitle">Registra y controla tus fuentes de ingreso</p>
        </div>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus size={18} />
          Nuevo ingreso
        </button>
      </div>

      {/* Stat card */}
      <div className="stat-grid">
        <div className="stat-card stat-green">
          <TrendingUp size={22} />
          <div>
            <p className="stat-label">Total ingresos</p>
            <p className="stat-value">${total.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Registros</p>
            <p className="stat-value">{ingresos.length}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="card form-card animate-fade-in">
          <h3 className="card-title">Agregar ingreso</h3>
          <div className="form-row">
            <input
              className="field"
              type="text"
              placeholder="Descripción"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
            />
            <input
              className="field"
              type="number"
              min="0" step="0.01" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
              placeholder="Monto ($)"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
            />
            <select
              className="field"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
            >
              {CATEGORIAS_INGRESOS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-primary" onClick={agregarIngreso}>Guardar</button>
            <button className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {datosGrafico.length > 0 && (
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
          <div className="card">
            <h3 className="card-title">Ingresos por día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fecha" tick={{ fill: "#8b949e", fontSize: 12 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1e272e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} itemStyle={{ color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend />
                <Bar dataKey="monto" fill="#00c896" name="Monto ($)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card">
        <h3 className="card-title">Historial</h3>
        {ingresos.length === 0 ? (
          <p className="empty-state">No hay ingresos registrados aún.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ingresosPaginados.map((ing) => (
                  <tr key={ing.id}>
                    <td className="muted">{new Date(ing.fecha.seconds * 1000).toLocaleDateString()}</td>
                    {editandoId === ing.id ? (
                      <>
                        <td><input className="field-inline" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} /></td>
                        <td>
                          <select className="field-inline" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}>
                            {CATEGORIAS_INGRESOS.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td><input className="field-inline" type="number" min="0" step="0.01" onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn green" onClick={() => guardarEdicion(ing.id)}><Check size={15}/></button>
                            <button className="icon-btn ghost" onClick={() => setEditandoId(null)}><X size={15}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{ing.descripcion}</td>
                        <td><span className="badge">{ing.categoria || "Sin categoría"}</span></td>
                        <td className="amount-green">${ing.monto.toLocaleString()}</td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn blue" onClick={() => { setEditandoId(ing.id); setEditDescripcion(ing.descripcion); setEditMonto(ing.monto); setEditCategoria(ing.categoria || "Salario"); }}><Pencil size={15}/></button>
                            <button className="icon-btn red" onClick={() => eliminarIngreso(ing.id)}><Trash2 size={15}/></button>
                          </div>
                        </td>
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

export default Ingresos;
