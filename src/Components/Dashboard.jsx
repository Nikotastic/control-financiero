// Importación de React y hooks
import React, { useEffect, useState } from "react";

// Importación de componentes de gráficos desde Recharts
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Importación de funciones de Firebase para leer datos en tiempo real
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase"; 

const COLORS = ["#00c896", "#f85a5a"];

export default function Dashboard() {
  // Estado para almacenar todos los movimientos, los datos del gráfico de barras y los datos del gráfico de pastel
  const [movimientos, setMovimientos] = useState([]);
  const [datosBarras, setDatosBarras] = useState([]);
  const [datosPastel, setDatosPastel] = useState([
    { name: "Ingresos", value: 0 },
    { name: "Gastos", value: 0 },
  ]);

  // useEffect se ejecuta una vez al montar el componente
  useEffect(() => {
    // Crear consulta a la colección "movimientos", ordenada por fecha descendente
    const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapear documentos a objetos con id
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMovimientos(datos); // Actualizar estado con los datos

      // Calcular el total de ingresos y gastos
      const ingresos = datos
        .filter((m) => m.tipo === "Ingreso")
        .reduce((acc, m) => acc + m.monto, 0);
      const gastos = datos
        .filter((m) => m.tipo === "Gasto")
        .reduce((acc, m) => acc + m.monto, 0);

      // Actualizar datos para el gráfico de pastel
      setDatosPastel([
        { name: "Ingresos", value: ingresos },
        { name: "Gastos", value: gastos },
      ]);

      // Agrupar ingresos y gastos por fecha para el gráfico de barras
      const agrupados = {};
      datos.forEach((mov) => {
        const fecha = new Date(mov.fecha.seconds * 1000).toLocaleDateString(); 
        if (!agrupados[fecha]) {
          agrupados[fecha] = { fecha, Ingresos: 0, Gastos: 0 };
        }
        // Sumar según el tipo
        if (mov.tipo === "Ingreso") agrupados[fecha].Ingresos += mov.monto;
        else agrupados[fecha].Gastos += mov.monto;
      });

      // Convertir a array y ordenar por fecha
      const barrasOrdenadas = Object.values(agrupados).sort((a, b) =>
        a.fecha.localeCompare(b.fecha)
      );
      setDatosBarras(barrasOrdenadas); // Actualizar estado del gráfico de barras
    });

    // Cancelar suscripción al desmontar el componente
    return () => unsubscribe();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 w-full max-w-[1200px]">
      {/* Gráfico de pastel */}
      <div className="bg-[#1e272e] p-6 rounded-xl shadow-md flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4 text-white">Distribución</h2>
        <PieChart width={250} height={250}>
          <Pie
            data={datosPastel}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {/* Asignar color a cada parte del pastel */}
            {datosPastel.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </div>

      {/* Gráfico de barras: ingresos vs gastos */}
      <div className="bg-[#1e272e] p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Ingresos vs Gastos</h2>
        <BarChart width={400} height={250} data={datosBarras}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Ingresos" fill="#00c896" />
          <Bar dataKey="Gastos" fill="#f85a5a" />
        </BarChart>
      </div>

      {/* Tabla de movimientos recientes */}
      <div className="bg-[#1e272e] col-span-1 xl:col-span-2 p-6 rounded-xl shadow-md mt-4">
        <h2 className="text-xl font-semibold mb-4 text-white">Movimientos recientes</h2>
        <table className="w-full text-left text-white">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Descripción</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {/* Renderizar cada movimiento como fila */}
            {movimientos.map((mov) => (
              <tr key={mov.id} className="border-t border-gray-700">
                <td className="py-2">
                  {new Date(mov.fecha.seconds * 1000).toLocaleDateString()}
                </td>
                <td>{mov.descripcion}</td>
                <td>{mov.tipo}</td>
                <td
                  className={
                    mov.tipo === "Ingreso" ? "text-green-400" : "text-red-400"
                  }
                >
                  ${mov.monto}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
