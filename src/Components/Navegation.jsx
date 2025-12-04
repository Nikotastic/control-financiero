import React, { useState } from "react";
// Importamos íconos desde lucide-react
import {
  House,
  CircleDollarSign,
  HandCoins,
  Receipt,
  FlagTriangleRight,
  TrendingUp,
  Settings,
  Menu,
} from "lucide-react";
// Importamos Link para navegación interna sin recarga de página
import { Link } from "react-router-dom";

export default function Navegation() {
  const [mostrarMenu, setMostrarMenu] = useState(true);

  // Función que cambia el estado del menú 
  const toggleMenu = () => {
    setMostrarMenu(!mostrarMenu);
  };

  return (
    // Contenedor principal del menú lateral
    <nav
      className={`text-white ${
        mostrarMenu ? "w-44" : "w-16"
      } transition-all duration-300 overflow-hidden h-[100vh] p-4 rounded-r-2xl`}
    >
      <div className="flex justify-between items-center mb-6 border-b border-[#485460] pb-2">
        <h2 className="text-[1.4rem] font-semibold whitespace-nowrap">
          {mostrarMenu && "Finanzas"}
        </h2>
        <Menu className="w-6 h-6 cursor-pointer" onClick={toggleMenu} />
      </div>

      {/* Lista de enlaces de navegación */}
      <ul className="list-none space-y-4">
        <li>
          {/* Enlace a la página principal */}
          <Link to="/" className="flex items-center gap-2">
            <House />
            {mostrarMenu && <p>Panel Principal</p>}
          </Link>
        </li>
        <li>
          <Link to="/ingresos" className="flex items-center gap-2">
            <CircleDollarSign />
            {mostrarMenu && <p>Ingresos</p>}
          </Link>
        </li>
        <li>
          <Link to="/gastos" className="flex items-center gap-2">
            <HandCoins />
            {mostrarMenu && <p>Gastos</p>}
          </Link>
        </li>
        <li>
          <a href="/presupuesto" className="flex items-center gap-2">
            <Receipt />
            {mostrarMenu && <p>Presupuesto</p>}
          </a>
        </li>
        <li>
          <a href="/reportes" className="flex items-center gap-2">
            <FlagTriangleRight />
            {mostrarMenu && <p>Reportes</p>}
          </a>
        </li>
        <li>
          <a href="/inversiones" className="flex items-center gap-2">
            <TrendingUp />
            {mostrarMenu && <p>Inversiones</p>}
          </a>
        </li>

        {/* Enlace a configuración, ubicado al final del menú */}
        <li className={`mt-[37vh]`}>
          <a href="/configuracion" className="flex items-center gap-2">
            <Settings />
            {mostrarMenu && <p>Configuración</p>}
          </a>
        </li>
      </ul>
    </nav>
  );
}
