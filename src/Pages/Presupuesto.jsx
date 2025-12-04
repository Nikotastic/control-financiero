import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  onSnapshot,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import Navegation from "../Components/Navegation";

// Función auxiliar para obtener el mes actual en formato YYYY-MM
const obtenerMesActual = () => {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mes}`;
};

// Categorías predefinidas para presupuestos por categoría
const CATEGORIAS = ["Comida", "Transporte", "Hogar", "Educación", "Ocio"];

export default function Presupuesto() {
  // Estados generales
  const [montoPresupuesto, setMontoPresupuesto] = useState("");
  const [presupuestoActual, setPresupuestoActual] = useState(null);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [mensaje, setMensaje] = useState("");

  // Estados para presupuesto por categoría
  const [categoria, setCategoria] = useState("Comida");
  const [montoCategoria, setMontoCategoria] = useState("");
  const [presupuestosCategoria, setPresupuestosCategoria] = useState([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});

  const mesActual = obtenerMesActual();

  // Obtener presupuesto general del mes actual
  useEffect(() => {
    const docRef = doc(db, "presupuesto", mesActual);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        setPresupuestoActual(docSnap.data().monto);
      }
    });
  }, [mesActual]);

  // Escuchar todos los movimientos del mes actual (ingresos y gastos)
  useEffect(() => {
    const q = query(collection(db, "movimientos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movimientos = snapshot.docs
        .map((doc) => doc.data())
        .filter((mov) => {
          if (!mov.fecha || !mov.tipo) return false;
          const fecha = new Date(mov.fecha.seconds * 1000);
          const mesDoc = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, "0")}`;
          return mesDoc === mesActual;
        });

      // Calcular totales
      const ingresos = movimientos
        .filter((m) => m.tipo === "Ingreso")
        .reduce((acc, m) => acc + m.monto, 0);

      const gastos = movimientos
        .filter((m) => m.tipo === "Gasto")
        .reduce((acc, m) => acc + m.monto, 0);

      // Agrupar gastos por categoría
      const agrupados = {};
      movimientos.forEach((m) => {
        if (m.tipo === "Gasto" && m.categoria) {
          agrupados[m.categoria] = (agrupados[m.categoria] || 0) + m.monto;
        }
      });

      // Actualizar estados
      setTotalIngresos(ingresos);
      setTotalGastos(gastos);
      setGastosPorCategoria(agrupados);
    });

    return () => unsubscribe(); // Cleanup
  }, [mesActual]);

  // Obtener presupuestos por categoría para el mes actual
  useEffect(() => {
    const q = query(
      collection(db, "presupuestos_categoria"),
      where("mes", "==", mesActual)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => doc.data());
      setPresupuestosCategoria(datos);
    });

    return () => unsubscribe();
  }, [mesActual]);

  // Guardar o actualizar presupuesto mensual general
  const guardarPresupuesto = async () => {
    if (!montoPresupuesto || isNaN(montoPresupuesto)) return;
    try {
      const monto = parseFloat(montoPresupuesto);
      await setDoc(doc(db, "presupuesto", mesActual), { monto });
      setPresupuestoActual(monto);
      setMensaje("✅ Presupuesto guardado");
      setTimeout(() => setMensaje(""), 2000);
      setMontoPresupuesto("");
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
    }
  };

  // Agregar presupuesto por categoría
  const agregarPresupuestoCategoria = async () => {
    if (!montoCategoria || isNaN(montoCategoria)) return;
    try {
      await addDoc(collection(db, "presupuestos_categoria"), {
        mes: mesActual,
        categoria,
        monto: parseFloat(montoCategoria),
      });
      setMontoCategoria("");
    } catch (error) {
      console.error("Error al guardar categoría:", error);
    }
  };

  // Cálculos para barra de progreso general
  const balance = totalIngresos - totalGastos;
  const usado = presupuestoActual !== null ? presupuestoActual - balance : 0;
  const porcentaje =
    presupuestoActual !== null && presupuestoActual > 0
      ? Math.min((usado / presupuestoActual) * 100, 100)
      : 0;

  const estado =
    porcentaje >= 100
      ? `❌ Te pasaste por $${(usado - presupuestoActual).toFixed(2)}`
      : porcentaje >= 80
      ? `⚠️ Has alcanzado el 80% del presupuesto`
      : `✅ Te quedan $${(presupuestoActual - usado).toFixed(2)}`;

  return (
    <div className="layout flex h-[100vh]">
      {/* Navegación lateral */}
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] shadow-lg z-20">
        <Navegation />
      </aside>

      {/* Contenido principal */}
      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Presupuesto</header>

        {/* Sección Presupuesto Mensual */}
        <section className="bg-[#1e272e] w-full max-w-md p-6 rounded-xl shadow-md text-white mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Presupuesto mensual ({mesActual})
          </h2>

          <input
            className="w-full p-2 mb-2 rounded bg-gray-700"
            type="number"
            placeholder="Monto mensual"
            value={montoPresupuesto}
            onChange={(e) => setMontoPresupuesto(e.target.value)}
          />
          <button
            onClick={guardarPresupuesto}
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Guardar Presupuesto
          </button>

          {mensaje && <p className="mt-2 text-green-400">{mensaje}</p>}

          {/* Barra de progreso y estado */}
          {presupuestoActual !== null && (
            <div className="mt-6">
              <p className="text-sm text-gray-300 mb-2">
                Ingresos: <span className="text-green-400">${totalIngresos}</span> | Gastos:{" "}
                <span className="text-red-400">${totalGastos}</span>
              </p>
              <div className="w-full h-4 bg-gray-600 rounded">
                <div
                  className={`h-4 rounded ${
                    porcentaje < 80
                      ? "bg-green-500"
                      : porcentaje < 100
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${porcentaje}%`, transition: "width 0.4s" }}
                />
              </div>
              <p className="mt-2 text-sm">{estado}</p>
            </div>
          )}
        </section>

        {/* Sección Presupuesto por Categoría */}
        <section className="bg-[#1e272e] w-full max-w-md p-6 rounded-xl shadow-md text-white">
          <h2 className="text-xl font-semibold mb-4">Presupuesto por categoría</h2>

          <div className="flex gap-2 mb-3">
            <select
              className="flex-1 p-2 rounded bg-gray-700"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <input
              className="flex-1 p-2 rounded bg-gray-700"
              type="number"
              placeholder="Monto"
              value={montoCategoria}
              onChange={(e) => setMontoCategoria(e.target.value)}
            />
          </div>

          <button
            onClick={agregarPresupuestoCategoria}
            className="w-full p-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Agregar Categoría
          </button>

          {/* Lista de categorías con barra de uso */}
          <div className="mt-6 space-y-4">
            {presupuestosCategoria.map((item) => {
              const gasto = gastosPorCategoria[item.categoria] || 0;
              const porcentaje = Math.min((gasto / item.monto) * 100, 100);
              const restante = item.monto - gasto;
              return (
                <div key={item.categoria}>
                  <p className="font-medium mb-1">{item.categoria}</p>
                  <div className="w-full h-3 bg-gray-700 rounded">
                    <div
                      className={`h-3 rounded ${
                        porcentaje < 80
                          ? "bg-green-500"
                          : porcentaje < 100
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${porcentaje}%`, transition: "width 0.4s" }}
                    />
                  </div>
                  <p className="text-sm mt-1 text-gray-300">
                    {gasto < item.monto
                      ? `Te quedan $${restante.toFixed(0)}`
                      : `❌ Excedido por $${Math.abs(restante).toFixed(0)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
