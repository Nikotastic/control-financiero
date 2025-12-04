
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
/* import "./Components/Navegation";
import "./Components/Dashboard"; */
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Importa las páginas (vistas) que componen tu aplicación
import Ingresos from "./Pages/Ingresos";
import Gastos from "./Pages/Gastos";
import Presupuesto from "./Pages/Presupuesto";
import Reportes from "./Pages/Reportes";
import Inversiones from "./Pages/Inversiones";
import Configuracion from "./Pages/Configuracion";

// Obtiene el nodo raíz del DOM donde se montará la app
const root = ReactDOM.createRoot(document.getElementById("root"));

// Renderiza la aplicación dentro de BrowserRouter para habilitar el enrutamiento
root.render(
  <BrowserRouter>
    <Routes>
      {/* Ruta principal que muestra el componente App */}
      <Route path="/" element={<App />} />

      {/* Rutas adicionales que corresponden a distintas secciones */}
      <Route path="/ingresos" element={<Ingresos />} />
      <Route path="/gastos" element={<Gastos />} />
      <Route path="/presupuesto" element={<Presupuesto />} />
      <Route path="/reportes" element={<Reportes />} />
      <Route path="/inversiones" element={<Inversiones />} />
      <Route path="/configuracion" element={<Configuracion />} />
    </Routes>
  </BrowserRouter>
);
