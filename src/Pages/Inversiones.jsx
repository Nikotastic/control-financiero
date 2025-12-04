import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebaseConfig/firebase"; 
import Navegation from "../Components/Navegation"; 

const Inversiones = () => {
  // Estados para controlar lista y formulario de inversiones
  const [inversiones, setInversiones] = useState([]);

  // Estados para nueva inversión
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState("Acciones");

  // Estados para edición
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editTipo, setEditTipo] = useState("Acciones");

  // Tipos de inversión predefinidos
  const TIPOS = ["Acciones", "Criptomonedas", "Bienes Raíces", "Fondos", "Otro"];

  // useEffect para escuchar cambios en la colección "inversiones"
  useEffect(() => {
    const q = query(collection(db, "inversiones"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInversiones(data); // Actualiza estado con las inversiones en tiempo real
    });

    return () => unsubscribe();
  }, []);

  // Función para agregar una nueva inversión
  const agregarInversion = async () => {
    if (!nombre || !monto) return;
    try {
      await addDoc(collection(db, "inversiones"), {
        nombre,
        monto: parseFloat(monto),
        tipo,
        fecha: Timestamp.fromDate(new Date()),
      });

      // Limpiar campos después de guardar
      setNombre("");
      setMonto("");
    } catch (error) {
      console.error("Error al agregar inversión:", error);
    }
  };

  // Función para iniciar el modo de edición
  const comenzarEdicion = (inv) => {
    setEditandoId(inv.id);
    setEditNombre(inv.nombre);
    setEditMonto(inv.monto);
    setEditTipo(inv.tipo);
  };

  // Función para guardar cambios editados
  const guardarEdicion = async (id) => {
    try {
      await updateDoc(doc(db, "inversiones", id), {
        nombre: editNombre,
        monto: parseFloat(editMonto),
        tipo: editTipo,
      });
      setEditandoId(null);
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // Función para eliminar una inversión
  const eliminarInversion = async (id) => {
    try {
      await deleteDoc(doc(db, "inversiones", id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  return (
    <div className="layout flex h-[100vh]">
      {/* Barra lateral con navegación */}
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] z-20">
        <Navegation />
      </aside>

      {/* Contenido principal */}
      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Inversiones</header>

        {/* Formulario para agregar inversión */}
        <div className="p-4 bg-gray-900 text-white rounded-xl w-full max-w-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Agregar Inversión</h2>

          <input
            className="w-full p-2 mb-2 rounded bg-gray-700"
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            className="w-full p-2 mb-2 rounded bg-gray-700"
            type="number"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />

          <select
            className="w-full p-2 mb-2 rounded bg-gray-700"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={agregarInversion}
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Guardar
          </button>
        </div>

        {/* Tabla con lista de inversiones */}
        <div className="bg-[#1e272e] w-full max-w-[1200px] p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Listado de inversiones</h2>

          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Monto</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inversiones.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-700">
                  {/* Fecha */}
                  <td className="py-2">
                    {new Date(inv.fecha.seconds * 1000).toLocaleDateString()}
                  </td>

                
                  {editandoId === inv.id ? (
                    <>
                      <td>
                        <input
                          className="bg-gray-700 rounded p-1 w-full"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="bg-gray-700 rounded p-1 w-full"
                          value={editTipo}
                          onChange={(e) => setEditTipo(e.target.value)}
                        >
                          {TIPOS.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="bg-gray-700 rounded p-1 w-full"
                          type="number"
                          value={editMonto}
                          onChange={(e) => setEditMonto(e.target.value)}
                        />
                      </td>
                      <td className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(inv.id)}
                          className="bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="bg-gray-600 px-2 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    // Modo visual normal
                    <>
                      <td>{inv.nombre}</td>
                      <td>{inv.tipo}</td>
                      <td className="text-blue-400">${inv.monto}</td>
                      <td className="flex gap-2">
                        <button
                          onClick={() => comenzarEdicion(inv)}
                          className="bg-blue-600 px-2 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarInversion(inv.id)}
                          className="bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Inversiones;
