import React, { useEffect, useState } from "react";
// Funciones de Firebase para manejar colección, tiempo real y CRUD
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase"; 
import Navegation from "../Components/Navegation"; // Componente del menú lateral

// Componentes de Recharts para los gráficos
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CATEGORIAS = ["Comida", "Transporte", "Hogar", "Educación", "Ocio"];
const COLORS = ["#f85a5a", "#ff9f43", "#00c896", "#4b7bec", "#a55eea"];

const Gastos = () => {
  // Estados principales
  const [gastos, setGastos] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Comida");

  // Estados para edición de un gasto
  const [editandoId, setEditandoId] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editCategoria, setEditCategoria] = useState("Comida");

  // useEffect: escucha los cambios en Firestore en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, "movimientos"),
      where("tipo", "==", "Gasto"),
      orderBy("fecha", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGastos(datos);
    });

    return () => unsubscribe();
  }, []);

  // Agregar nuevo gasto a Firestore
  const agregarGasto = async () => {
    try {
      await addDoc(collection(db, "movimientos"), {
        descripcion,
        monto: parseFloat(monto),
        tipo: "Gasto",
        categoria,
        fecha: Timestamp.fromDate(new Date()),
      });
      setDescripcion("");
      setMonto("");
    } catch (error) {
      console.error("Error al agregar gasto:", error);
    }
  };

  // Preparar los datos para editar un gasto
  const comenzarEdicion = (gasto) => {
    setEditandoId(gasto.id);
    setEditDescripcion(gasto.descripcion);
    setEditMonto(gasto.monto);
    setEditCategoria(gasto.categoria || "Comida");
  };

  // Guardar cambios en el gasto editado
  const guardarEdicion = async (id) => {
    try {
      await updateDoc(doc(db, "movimientos", id), {
        descripcion: editDescripcion,
        monto: parseFloat(editMonto),
        categoria: editCategoria,
      });
      setEditandoId(null); // Salir del modo edición
    } catch (error) {
      console.error("Error al editar gasto:", error);
    }
  };

  // Eliminar gasto de Firestore
  const eliminarGasto = async (id) => {
    try {
      await deleteDoc(doc(db, "movimientos", id));
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
    }
  };

  // Datos para gráfico circular
  const datosPastel = CATEGORIAS.map((cat) => {
    const total = gastos
      .filter((g) => g.categoria === cat)
      .reduce((acc, g) => acc + g.monto, 0);
    return { name: cat, value: total };
  }).filter((d) => d.value > 0); // Excluye categorías sin gastos

  // Datos para gráfico de barras 
  const datosBarras = (() => {
    const agrupados = {};
    gastos.forEach((g) => {
      const fecha = new Date(g.fecha.seconds * 1000).toLocaleDateString();
      if (!agrupados[fecha]) agrupados[fecha] = { fecha, monto: 0 };
      agrupados[fecha].monto += g.monto;
    });
    return Object.values(agrupados).sort((a, b) => a.fecha.localeCompare(b.fecha));
  })();

  return (
    <div className="layout flex h-[100vh]">
      {/* Sidebar con navegación */}
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] shadow-lg z-20">
        <Navegation />
      </aside>

      {/* Contenido principal */}
      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Gastos</header>

        {/* Formulario para agregar gasto */}
        <div className="p-4 bg-gray-900 text-white rounded-xl w-full max-w-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Agregar Gasto</h2>
          <input
            className="w-full p-2 mb-2 rounded bg-gray-700"
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
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
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={agregarGasto}
            className="w-full p-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Guardar
          </button>
        </div>

        {/* Tabla de gastos registrados */}
        <div className="bg-[#1e272e] w-full max-w-[1200px] p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Gastos registrados</h2>
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Descripción</th>
                <th className="pb-2">Monto</th>
                <th className="pb-2">Categoría</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="border-t border-gray-700">
                  <td className="py-2">
                    {new Date(gasto.fecha.seconds * 1000).toLocaleDateString()}
                  </td>

                  {/* Modo edición */}
                  {editandoId === gasto.id ? (
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
                      <td>
                        <select
                          className="bg-gray-700 rounded p-1 w-full"
                          value={editCategoria}
                          onChange={(e) => setEditCategoria(e.target.value)}
                        >
                          {CATEGORIAS.map((cat) => (
                            <option key={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(gasto.id)}
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
                    // Vista normal
                    <>
                      <td>{gasto.descripcion}</td>
                      <td className="text-red-400">${gasto.monto}</td>
                      <td>{gasto.categoria || "Sin categoría"}</td>
                      <td className="flex gap-2">
                        <button
                          onClick={() => comenzarEdicion(gasto)}
                          className="bg-blue-600 px-2 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarGasto(gasto.id)}
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

        {/* Gráfico de pastel por categoría */}
        <section className="w-full max-w-[1200px] mt-8 p-6 bg-[#1e272e] rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-white">Distribución por categoría</h2>
          {datosPastel.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosPastel}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {datosPastel.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400">No hay datos para mostrar.</p>
          )}
        </section>

        {/* Gráfico de barras por día */}
        <section className="w-full max-w-[1200px] mt-6 p-6 bg-[#1e272e] rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-white">Gastos por día</h2>
          {datosBarras.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="monto" fill="#f85a5a" name="Gasto ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400">No hay datos para mostrar.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Gastos;
