import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, addDoc, deleteDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { Plus, Pencil, Trash2, X, Check, Users, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../Components/ToastProvider";

const Deudas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deudas, setDeudas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  
  const [persona, setPersona] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("Me deben");
  
  const [editandoId, setEditandoId] = useState(null);
  const [editPersona, setEditPersona] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState("Me deben");

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "deudas"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      datos.sort((a, b) => b.fecha.seconds - a.fecha.seconds);
      setDeudas(datos);
    });
    return () => unsub();
  }, [user.uid]);

  const totalMeDeben = deudas.filter(d => d.tipo === "Me deben" && !d.pagado).reduce((acc, d) => acc + d.monto, 0);
  const totalDebo = deudas.filter(d => d.tipo === "Debo" && !d.pagado).reduce((acc, d) => acc + d.monto, 0);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo, filtroEstado, filtroFecha]);

  const deudasFiltradas = deudas.filter(d => {
    const matchBusqueda = d.persona.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "Todas" ? true : d.tipo === filtroTipo;
    const matchEstado = filtroEstado === "Todas" ? true : (filtroEstado === "Pagadas" ? d.pagado : !d.pagado);
    
    let matchFecha = true;
    if (filtroFecha) {
      const f = new Date(d.fecha.seconds * 1000);
      const fechaLocal = f.toLocaleDateString('en-CA'); // Obtiene "YYYY-MM-DD" local
      matchFecha = (fechaLocal === filtroFecha);
    }

    return matchBusqueda && matchTipo && matchEstado && matchFecha;
  });

  const ELEMENTOS_POR_PAGINA = 10;
  const totalPaginas = Math.max(1, Math.ceil(deudasFiltradas.length / ELEMENTOS_POR_PAGINA));
  const deudasPaginadas = deudasFiltradas.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  const agregarDeuda = async () => {
    if (!persona || !monto) {
      toast("Completa la persona y el monto", "warning");
      return;
    }
    const valMonto = parseFloat(monto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El monto debe ser superior a 0", "error");
      return;
    }

    try {
      await addDoc(collection(db, "deudas"), {
        persona,
        monto: valMonto,
        tipo,
        pagado: false,
        fecha: Timestamp.fromDate(new Date()),
        uid: user.uid,
      });
      toast("Registro añadido exitosamente", "success");
      setPersona(""); setMonto(""); setMostrarForm(false);
    } catch (e) {
      console.error(e);
      toast("Error al guardar", "error");
    }
  };

  const guardarEdicion = async (id) => {
    if (!editPersona || !editMonto) {
      toast("Los campos no pueden estar vacíos", "warning");
      return;
    }
    const valMonto = parseFloat(editMonto);
    if (isNaN(valMonto) || valMonto <= 0) {
      toast("El monto actualizado debe ser superior a 0", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "deudas", id), {
        persona: editPersona,
        monto: valMonto,
        tipo: editTipo,
      });
      toast("Actualizado correctamente", "success");
      setEditandoId(null);
    } catch (e) {
      console.error(e);
      toast("Error al actualizar", "error");
    }
  };

  const alternarEstadoPago = async (deuda) => {
    try {
      await updateDoc(doc(db, "deudas", deuda.id), {
        pagado: !deuda.pagado
      });
      toast(deuda.pagado ? "Marcado como pendiente" : "Marcado como pagado", "info");
    } catch (e) {
      console.error(e);
    }
  };

  const eliminarDeuda = async (id) => {
    try { 
      await deleteDoc(doc(db, "deudas", id)); 
      toast("Registro eliminado", "success");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Deudas y Préstamos</h2>
          <p className="page-subtitle">Controla a quién le debes y quién te debe</p>
        </div>
        <button className="btn-blue" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus size={18} /> Nuevo registro
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-green">
          <Users size={22} />
          <div>
            <p className="stat-label">Total que me deben</p>
            <p className="stat-value amount-green">${totalMeDeben.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card stat-red">
          <Users size={22} />
          <div>
            <p className="stat-label">Total que debo</p>
            <p className="stat-value amount-red">${totalDebo.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {mostrarForm && (
        <div className="card form-card animate-fade-in">
          <h3 className="card-title">Agregar registro</h3>
          <div className="form-row">
            <input className="field" type="text" placeholder="Nombre de la persona" value={persona} onChange={(e) => setPersona(e.target.value)} />
            <input className="field" type="number" min="0" step="0.01" onKeyDown={(e) => { if (!/^[0-9.]$/.test(e.key) && !["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"].includes(e.key)) e.preventDefault(); }} placeholder="Monto ($)" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="Me deben">Me deben (Préstamo dado)</option>
              <option value="Debo">Debo (Préstamo recibido)</option>
            </select>
            <button className="btn-primary" onClick={agregarDeuda}>Guardar</button>
            <button className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Historial</h3>
          <div className="filter-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              <input type="text" className="field" placeholder="Buscar persona..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ paddingLeft: '35px', width: '200px' }} />
            </div>
            <select className="field-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="Todas">Todos los tipos</option>
              <option value="Me deben">Me deben (Préstamos)</option>
              <option value="Debo">Debo (Deudas)</option>
            </select>
            <select className="field-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="Todas">Cualquier estado</option>
              <option value="Pendientes">⏳ Pendientes</option>
              <option value="Pagadas">✅ Pagadas</option>
            </select>
            <div className="search-box" style={{ position: 'relative' }}>
              <input type="date" className="field-sm" style={{ paddingLeft: '10px' }} value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} title="Filtrar por fecha exacta" />
            </div>
          </div>
        </div>

        {deudas.length === 0 ? (
          <p className="empty-state">No hay deudas ni préstamos registrados.</p>
        ) : deudasFiltradas.length === 0 ? (
          <p className="empty-state">No hay resultados para tu búsqueda.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Persona</th><th>Tipo</th><th>Monto</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudasPaginadas.map((d) => (
                  <tr key={d.id} style={{ opacity: d.pagado ? 0.6 : 1 }}>
                    <td className="muted">{new Date(d.fecha.seconds * 1000).toLocaleDateString()}</td>
                    {editandoId === d.id ? (
                      <>
                        <td><input className="field-inline" value={editPersona} onChange={(e) => setEditPersona(e.target.value)} /></td>
                        <td>
                          <select className="field-inline" value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>
                            <option value="Me deben">Me deben</option>
                            <option value="Debo">Debo</option>
                          </select>
                        </td>
                        <td><input className="field-inline" type="number" min="0" step="0.01" onKeyDown={(e) => { if (!/^[0-9.]$/.test(e.key) && !["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"].includes(e.key)) e.preventDefault(); }} value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></td>
                        <td>
                          <button className={`status-toggle ${d.pagado ? 'status-paid' : 'status-pending'}`} onClick={() => alternarEstadoPago(d)}>
                            {d.pagado ? "✅ Pagado" : "⏳ Pendiente"}
                          </button>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn green" onClick={() => guardarEdicion(d.id)}><Check size={15}/></button>
                            <button className="icon-btn ghost" onClick={() => setEditandoId(null)}><X size={15}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 500 }}>{d.persona}</td>
                        <td>
                          <span className={`badge ${d.tipo === "Me deben" ? "badge-blue" : "badge-orange"}`}>{d.tipo}</span>
                        </td>
                        <td className={d.tipo === "Me deben" ? "amount-green" : "amount-red"}>
                          ${d.monto.toLocaleString()}
                        </td>
                        <td>
                          <button className={`status-toggle ${d.pagado ? 'status-paid' : 'status-pending'}`} onClick={() => alternarEstadoPago(d)}>
                            {d.pagado ? "✅ Pagado" : "⏳ Pendiente"}
                          </button>
                        </td>
                        <td>
                          <div className="action-btns">
                            {!d.pagado && (
                              <button className="icon-btn blue" onClick={() => { setEditandoId(d.id); setEditPersona(d.persona); setEditMonto(d.monto); setEditTipo(d.tipo); }}><Pencil size={15}/></button>
                            )}
                            <button className="icon-btn red" onClick={() => eliminarDeuda(d.id)}><Trash2 size={15}/></button>
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

export default Deudas;
