import React, { useEffect, useState } from "react";
import {
  collection, addDoc, deleteDoc, updateDoc, onSnapshot,
  doc, Timestamp, query, orderBy, where
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { Plus, Pencil, Trash2, X, Check, TrendingUp, Search, ChevronLeft, ChevronRight } from "lucide-react";

const TIPOS = ["Acciones", "Criptomonedas", "Bienes Raíces", "Fondos", "Otro"];
const TIPO_COLOR = {
  Acciones: "#4b7bec", Criptomonedas: "#ff9f43", "Bienes Raíces": "#00c896",
  Fondos: "#a55eea", Otro: "#8b949e",
};

import { useAuth } from "../context/AuthContext";
import { useToast } from "../Components/ToastProvider";

const Inversiones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inversiones, setInversiones] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("Acciones");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState("Acciones");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo, filtroFecha]);

  useEffect(() => {
    const q = query(collection(db, "inversiones"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Ordenar por fecha localmente para evitar requerir un índice compuesto en Firestore
      datos.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setInversiones(datos);
    });
    return () => unsub();
  }, [user.uid]);

  const totalInvertido = inversiones.reduce((a, i) => a + i.monto, 0);

  const agregarInversion = async () => {
    if (!nombre || !monto) {
      toast("Completa el nombre y monto de la inversión", "warning");
      return;
    }
    const valMonto = parseFloat(monto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El monto de la inversión debe ser superior a 0", "error");
      return;
    }

    try {
      await addDoc(collection(db, "inversiones"), {
        nombre, monto: valMonto, tipo, fecha: Timestamp.fromDate(new Date()), uid: user.uid,
      });
      toast("Inversión agregada a tu portafolio", "success");
      setNombre(""); setMonto(""); setMostrarForm(false);
    } catch (e) { 
      console.error(e); 
      toast("Hubo un error al registrar la inversión", "error");
    }
  };

  const guardarEdicion = async (id) => {
    if (!editNombre || !editMonto) {
      toast("Los campos no pueden estar vacíos", "warning");
      return;
    }
    const valMonto = parseFloat(editMonto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El monto actualizado debe ser superior a 0", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "inversiones", id), {
        nombre: editNombre, monto: valMonto, tipo: editTipo,
      });
      toast("Inversión actualizada correctamente", "success");
      setEditandoId(null);
    } catch (e) { 
      console.error(e); 
      toast("Error al actualizar la inversión", "error");
    }
  };

  const eliminarInversion = async (id) => {
    try { await deleteDoc(doc(db, "inversiones", id)); }
    catch (e) { console.error(e); }
  };

  const inversionesFiltradas = inversiones.filter(inv => {
    const matchBusqueda = (inv.nombre || "").toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "Todas" ? true : inv.tipo === filtroTipo;
    let matchFecha = true;
    if (filtroFecha) {
      const f = new Date(inv.fecha.seconds * 1000);
      const fechaLocal = f.toLocaleDateString('en-CA');
      matchFecha = (fechaLocal === filtroFecha);
    }
    return matchBusqueda && matchTipo && matchFecha;
  });

  const totalPaginas = Math.max(1, Math.ceil(inversionesFiltradas.length / itemsPorPagina));
  const indiceUltimo = paginaActual * itemsPorPagina;
  const indicePrimer = indiceUltimo - itemsPorPagina;
  const inversionesPaginadas = inversionesFiltradas.slice(indicePrimer, indiceUltimo);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inversiones</h2>
          <p className="page-subtitle">Registra y monitorea tu portafolio</p>
        </div>
        <button className="btn-blue" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus size={18} /> Nueva inversión
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-blue">
          <TrendingUp size={22} />
          <div>
            <p className="stat-label">Total invertido</p>
            <p className="stat-value">${totalInvertido.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Posiciones</p>
            <p className="stat-value">{inversiones.length}</p>
          </div>
        </div>
      </div>

      {mostrarForm && (
        <div className="card form-card animate-fade-in">
          <h3 className="card-title">Agregar inversión</h3>
          <div className="form-row">
            <input className="field" type="text" placeholder="Nombre del activo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input className="field" type="number" min="0" step="0.01" onKeyDown={(e) => { if (!/^[0-9.]$/.test(e.key) && !["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"].includes(e.key)) e.preventDefault(); }} placeholder="Monto ($)" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="btn-blue" onClick={agregarInversion}>Guardar</button>
            <button className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Portafolio</h3>
          <div className="filter-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              <input type="text" className="field" placeholder="Buscar posición..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ paddingLeft: '35px', width: '200px' }} />
            </div>
            <select className="field-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="Todas">Cualquier tipo</option>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="search-box" style={{ position: 'relative' }}>
              <input type="date" className="field-sm" style={{ paddingLeft: '10px' }} value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} title="Filtrar por fecha exacta" />
            </div>
          </div>
        </div>

        {inversiones.length === 0 ? (
          <p className="empty-state">Sin inversiones registradas aún.</p>
        ) : inversionesFiltradas.length === 0 ? (
          <p className="empty-state">No hay resultados para tu búsqueda.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th>Monto</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {inversionesPaginadas.map((inv) => (
                  <tr key={inv.id}>
                    <td className="muted">{new Date(inv.fecha.seconds * 1000).toLocaleDateString()}</td>
                    {editandoId === inv.id ? (
                      <>
                        <td><input className="field-inline" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} /></td>
                        <td><select className="field-inline" value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></td>
                        <td><input className="field-inline" type="number" min="0" step="0.01" onKeyDown={(e) => { if (!/^[0-9.]$/.test(e.key) && !["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"].includes(e.key)) e.preventDefault(); }} value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></td>
                        <td><div className="action-btns">
                          <button className="icon-btn green" onClick={() => guardarEdicion(inv.id)}><Check size={15}/></button>
                          <button className="icon-btn ghost" onClick={() => setEditandoId(null)}><X size={15}/></button>
                        </div></td>
                      </>
                    ) : (
                      <>
                        <td>{inv.nombre}</td>
                        <td><span className="badge" style={{ background: TIPO_COLOR[inv.tipo] + "22", color: TIPO_COLOR[inv.tipo] }}>{inv.tipo}</span></td>
                        <td className="amount-blue">${inv.monto.toLocaleString()}</td>
                        <td><div className="action-btns">
                          <button className="icon-btn blue" onClick={() => { setEditandoId(inv.id); setEditNombre(inv.nombre); setEditMonto(inv.monto); setEditTipo(inv.tipo); }}><Pencil size={15}/></button>
                          <button className="icon-btn red" onClick={() => eliminarInversion(inv.id)}><Trash2 size={15}/></button>
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
                  className="icon-btn ghost" 
                  disabled={paginaActual === 1} 
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  title="Anterior"
                ><ChevronLeft size={16} /></button>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {paginaActual} / {totalPaginas}
                </span>
                <button 
                  className="icon-btn ghost" 
                  disabled={paginaActual === totalPaginas} 
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  title="Siguiente"
                ><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inversiones;
