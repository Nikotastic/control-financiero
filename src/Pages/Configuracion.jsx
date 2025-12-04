import React from "react";
import Navegation from "../Components/Navegation";

const Configuracion = () => {
  return (
    <div className="layout flex h-[100vh]">
      <aside className="sidebar sticky top-0 h-screen w-[220px] bg-black text-white p-8 rounded-r-[20px] shadow-lg z-20">
        <Navegation />
      </aside>

      <main className="main-content flex flex-1 flex-col items-center pt-8 px-6 overflow-auto text-white">
        <header className="text-4xl font-bold mb-6">Configuración</header>

        <section className="w-full max-w-[600px] bg-[#1e272e] p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Opciones Generales</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Idioma</label>
              <select className="w-full p-2 rounded bg-gray-700 text-white">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Tema</label>
              <select className="w-full p-2 rounded bg-gray-700 text-white">
                <option value="oscuro">Oscuro</option>
                <option value="claro">Claro</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Notificaciones</label>
              <select className="w-full p-2 rounded bg-gray-700 text-white">
                <option value="activadas">Activadas</option>
                <option value="desactivadas">Desactivadas</option>
              </select>
            </div>

            <div className="text-right mt-6">
              <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                Guardar Cambios
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Configuracion;
