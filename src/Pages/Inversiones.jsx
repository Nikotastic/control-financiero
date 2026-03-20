import React, { useEffect, useState } from "react";
import {
  collection, addDoc, deleteDoc, updateDoc, onSnapshot,
  doc, Timestamp, query, orderBy, where
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { Plus, Pencil, Trash2, X, Check, TrendingUp } from "lucide-react";

const TIPOS = ["Acciones", "Criptomonedas", "Bienes Raíces", "Fondos", "Otro"];
const TIPO_COLOR = {
  Acciones: "#4b7bec", Criptomonedas: "#ff9f43", "Bienes Raíces": "#00c896",
  Fondos: "#a55eea", Otro: "#8b949e",
};

import { useAuth } from "../context/AuthContext";

const Inversiones = () => {
  const { user } = useAuth();
  const [inversiones, setInversiones] = useState([]);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("Acciones");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState("Acciones");
  const [mostrarForm, setMostrarForm] = useState(false);

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
    if (!nombre || !monto) return;
    try {
      await addDoc(collection(db, "inversiones"), {
        nombre, monto: parseFloat(monto), tipo, fecha: Timestamp.fromDate(new Date()), uid: user.uid,
      });
      setNombre(""); setMonto(""); setMostrarForm(false);
    } catch (e) { console.error(e); }
  };

  const guardarEdicion = async (id) => {
    try {
      await updateDoc(doc(db, "inversiones", id), {
        nombre: editNombre, monto: parseFloat(editMonto), tipo: editTipo,
      });
      setEditandoId(null);
    } catch (e) { console.error(e); }
  };

  const eliminarInversion = async (id) => {
    try { await deleteDoc(doc(db, "inversiones", id)); }
    catch (e) { console.error(e); }
  };

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
            <input className="field" type="number" placeholder="Monto ($)" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <select className="field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="btn-blue" onClick={agregarInversion}>Guardar</button>
            <button className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Portafolio</h3>
        {inversiones.length === 0 ? (
          <p className="empty-state">Sin inversiones registradas aún.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th>Monto</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {inversiones.map((inv) => (
                  <tr key={inv.id}>
                    <td className="muted">{new Date(inv.fecha.seconds * 1000).toLocaleDateString()}</td>
                    {editandoId === inv.id ? (
                      <>
                        <td><input className="field-inline" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} /></td>
                        <td><select className="field-inline" value={editTipo} onChange={(e) => setEditTipo(e.target.value)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></td>
                        <td><input className="field-inline" type="number" value={editMonto} onChange={(e) => setEditMonto(e.target.value)} /></td>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Inversiones;
