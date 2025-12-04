import React, { useEffect, useState } from "react";
// Importación de funciones de Firestore para CRUD y manejo de fechas
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import Navegation from "../Components/Navegation";

// Importación de componentes de Recharts para gráficos
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Ingresos = () => {
  // Estados para manejar datos y formularios
  const [ingresos, setIngresos] = useState([]);
  const [total, setTotal] = useState(0);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");

  // useEffect para escuchar cambios en la colección de Firestore
  useEffect(() => {
    const q = query(
      collection(db, "movimientos"),
      where("tipo", "==", "Ingreso"), // Filtra solo ingresos
      orderBy("fecha", "desc") // Ordena por fecha descendente
    );

    // Escucha en tiempo real los datos de Firestore
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapeo de documentos y filtrado por registros válidos
      const datos = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((doc) => doc.fecha);

      setIngresos(datos);

      // Sumar todos los montos
      const suma = datos.reduce((acc, mov) => acc + mov.monto, 0);
      setTotal(suma);

      // Agrupar por fecha para el gráfico
      const agrupados = {};
      datos.forEach((mov) => {
        const fecha = new Date(mov.fecha.seconds * 1000).toLocaleDateString();
        if (!agrupados[fecha]) agrupados[fecha] = { fecha, monto: 0 };
        agrupados[fecha].monto += mov.monto;
      });

      // Convertir en array y ordenar
      const formatoFinal = Object.values(agrupados).sort((a, b) =>
        a.fecha.localeCompare(b.fecha)
      );
      setDatosGrafico(formatoFinal);
    });

    // Cleanup del listener
    return () => unsubscribe();
  }, []);

  // Función para agregar un nuevo ingreso a Firestore
  const agregarIngreso = async () => {
    try {
      await addDoc(collection(db, "movimientos"), {
        descripcion: nuevaDescripcion,
        monto: parseFloat(nuevoMonto),
        tipo: "Ingreso",
        fecha: Timestamp.fromDate(new Date()),
      });
      // Limpiar inputs d
      setNuevaDescripcion("");
      setNuevoMonto("");
    } catch (error) {
      console.error("Error al agregar:", error);
    }
  };

  // Preparar el formulario de edición
  const comenzarEdicion = (ingreso) => {
    setEditandoId(ingreso.id);
    setEditDescripcion(ingreso.descripcion);
    setEditMonto(ingreso.monto);
  };

  // Guardar los cambios de un ingreso editado
  const guardarEdicion = async (id) => {
    try {
      await updateDoc(doc(db, "movimientos", id), {
        descripcion: editDescripcion,
        monto: parseFloat(editMonto),
      });
      
      setEditandoId(null);
      setEditDescripcion("");
      setEditMonto("");
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // Eliminar un ingreso de Firestore
  const eliminarIngreso = async (id) => {
    try {
      await deleteDoc(doc(db, "movimientos", id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // Renderizado del componente
  return (
    <div className="layout flex h-[100vh]">
      {/* Barra lateral de navegación */}
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] shadow-lg z-20">
        <Navegation />
      </aside>

      {/* Contenido principal */}
      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Ingresos</header>

        {/* Sección principal con datos, formulario y gráfico */}
        <section className="w-full max-w-[1200px] animate-fade-in bg-[#1e272e] p-6 rounded-xl shadow-md mb-8">
          {/* Total de ingresos */}
          <div className="mb-6 text-lg font-semibold text-green-400">
             Total de ingresos: ${total}
          </div>

          {/* Formulario para agregar nuevos ingresos */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-900 text-white rounded-xl w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Agregar Ingreso</h2>
              <input
                className="w-full p-2 mb-2 rounded bg-gray-700"
                type="text"
                placeholder="Descripción"
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
              />
              <input
                className="w-full p-2 mb-2 rounded bg-gray-700"
                type="number"
                placeholder="Monto"
                value={nuevoMonto}
                onChange={(e) => setNuevoMonto(e.target.value)}
              />
              <button
                onClick={agregarIngreso}
                className="w-full p-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Gráfico de ingresos por día */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Ingresos por día</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="monto" fill="#00c896" name="Monto ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de ingresos con opciones de edición y eliminación */}
          <table className="w-full text-left text-white" key={ingresos.length + total}>
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Descripción</th>
                <th className="pb-2">Monto</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id} className="border-t border-gray-700">
                  {/* Fecha */}
                  <td className="py-2">
                    {new Date(ingreso.fecha.seconds * 1000).toLocaleDateString()}
                  </td>

            
                  {editandoId === ingreso.id ? (
                    <>
                      <td>
                        <input
                          className="bg-gray-700 rounded p-1 w-full"
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                        />
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
                          onClick={() => guardarEdicion(ingreso.id)}
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
                      <td>{ingreso.descripcion}</td>
                      <td className="text-green-400">${ingreso.monto}</td>
                      <td className="flex gap-2">
                        <button
                          onClick={() => comenzarEdicion(ingreso)}
                          className="bg-blue-600 px-2 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarIngreso(ingreso.id)}
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
        </section>
      </main>
    </div>
  );
};

export default Ingresos;
