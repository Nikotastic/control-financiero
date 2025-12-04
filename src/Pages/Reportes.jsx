import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import Navegation from "../Components/Navegation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Colores para el gráfico de pastel
const COLORS = ["#f85a5a", "#ff9f43", "#00c896", "#4b7bec", "#a55eea"];

const Reportes = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Obtener todos los movimientos de Firestore en tiempo real
  useEffect(() => {
    const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMovimientos(datos);
    });
    return () => unsubscribe();
  }, []);

  // Filtrar los movimientos por mes y año seleccionados
  const movimientosFiltrados = movimientos.filter((mov) => {
    const fecha = new Date(mov.fecha.seconds * 1000);
    return (
      fecha.getMonth() === parseInt(mesSeleccionado) &&
      fecha.getFullYear() === parseInt(anioSeleccionado)
    );
  });

  const ingresos = movimientosFiltrados.filter((m) => m.tipo === "Ingreso");
  const gastos = movimientosFiltrados.filter((m) => m.tipo === "Gasto");

  const totalIngresos = ingresos.reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = gastos.reduce((acc, m) => acc + m.monto, 0);
  const balance = totalIngresos - totalGastos;

  // Agrupar gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] || 0) + m.monto;
    return acc;
  }, {});

  // Preparar datos para el gráfico de pastel
  const datosPastel = Object.entries(gastosPorCategoria).map(([cat, monto]) => ({
    name: cat,
    value: monto,
  }));

  // Top 5 gastos
  const topGastos = [...gastos].sort((a, b) => b.monto - a.monto).slice(0, 5);

  return (
    <div className="layout flex h-[100vh]">
      {/* Menú lateral */}
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] shadow-lg z-20">
        <Navegation />
      </aside>

      {/* Contenido principal */}
      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Reportes</header>

        {/* Filtro de mes y año */}
        <div className="mb-6 flex gap-4 items-center">
          <select
            className="bg-gray-800 text-white rounded p-2"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
          >
            {[...Array(12).keys()].map((m) => (
              <option key={m} value={m}>
                {new Date(0, m).toLocaleString("es-ES", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-800 text-white rounded p-2"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
          >
            {[2024, 2025, 2026].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen de ingresos, gastos y balance */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1200px] mb-8">
          <div className="bg-[#1e272e] p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-green-400">Ingresos</h3>
            <p className="text-2xl font-bold">${totalIngresos}</p>
          </div>
          <div className="bg-[#1e272e] p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-red-400">Gastos</h3>
            <p className="text-2xl font-bold">${totalGastos}</p>
          </div>
          <div className="bg-[#1e272e] p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold">Balance</h3>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${balance}
            </p>
          </div>
        </section>

        {/* Gráfico de pastel por categoría */}
        <section className="w-full max-w-[1200px] p-6 bg-[#1e272e] rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Distribución de gastos por categoría</h2>
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
            <p className="text-gray-400">No hay datos suficientes.</p>
          )}
        </section>

        {/* Tabla de top 5 gastos */}
        <section className="w-full max-w-[1200px] p-6 bg-[#1e272e] rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Top 5 gastos</h2>
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Descripción</th>
                <th className="pb-2">Categoría</th>
                <th className="pb-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {topGastos.map((gasto) => (
                <tr key={gasto.id} className="border-t border-gray-700">
                  <td className="py-2">
                    {new Date(gasto.fecha.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td>{gasto.descripcion}</td>
                  <td>{gasto.categoria || "Sin categoría"}</td>
                  <td className="text-red-400">${gasto.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Reportes;
