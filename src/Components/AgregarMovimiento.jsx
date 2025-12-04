import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { Timestamp } from "firebase/firestore";

// Lista de categorías que se usan si el tipo es "Gasto"
const CATEGORIAS = ["Comida", "Transporte", "Hogar", "Educación", "Ocio"];

const AgregarMovimiento = () => {
  // Estados del formulario
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("Ingreso"); 
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Comida");

  // Función para guardar el movimiento en Firestore
  const guardarMovimiento = async () => {
    try {
      // Guardamos en la colección "movimientos"
      await addDoc(collection(db, "movimientos"), {
        descripcion,
        tipo,
        monto: parseFloat(monto), 
        fecha: Timestamp.fromDate(new Date()), 
        categoria: tipo === "Gasto" ? categoria : null, // Solo si es gasto
      });

      console.log("Movimiento guardado");

      // Limpiamos los campos del formulario
      setDescripcion("");
      setMonto("");
    } catch (e) {
      console.error("Error al guardar: ", e);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl w-full max-w-md">
      {/* Título del formulario */}
      <h2 className="text-xl font-semibold mb-4">Agregar Movimiento</h2>

      {/* Campo: Descripción del movimiento */}
      <input
        className="w-full p-2 mb-2 rounded bg-gray-700"
        type="text"
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      {/* Selector de tipo: Ingreso o Gasto */}
      <select
        className="w-full p-2 mb-2 rounded bg-gray-700"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
      >
        <option value="Ingreso">Ingreso</option>
        <option value="Gasto">Gasto</option>
      </select>

      {/* Selector de categoría (solo si el tipo es Gasto) */}
      {tipo === "Gasto" && (
        <select
          className="w-full p-2 mb-2 rounded bg-gray-700"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {/* Generamos las opciones desde el array CATEGORIAS */}
          {CATEGORIAS.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      )}

      {/* Campo: Monto del movimiento */}
      <input
        className="w-full p-2 mb-2 rounded bg-gray-700"
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />

      {/* Botón para guardar el movimiento */}
      <button
        onClick={guardarMovimiento}
        className="w-full p-2 bg-green-600 hover:bg-green-700 rounded"
      >
        Guardar
      </button>
    </div>
  );
};

export default AgregarMovimiento;
