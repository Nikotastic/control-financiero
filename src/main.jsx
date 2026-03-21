import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas
import Ingresos     from "./Pages/Ingresos";
import Gastos       from "./Pages/Gastos";
import Presupuesto  from "./Pages/Presupuesto";
import Reportes     from "./Pages/Reportes";
import Inversiones  from "./Pages/Inversiones";
import Configuracion from "./Pages/Configuracion";
import Login        from "./Pages/Login";
import NotFound     from "./Pages/NotFound";
import { App }      from "./App";

// Auth + Toast
import { AuthProvider }    from "./context/AuthContext";
import ProtectedRoute      from "./Components/ProtectedRoute";
import { ToastProvider }   from "./Components/ToastProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));

const P = ({ Page }) => (
  <ProtectedRoute>
    <App>
      <Page />
    </App>
  </ProtectedRoute>
);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/"              element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/ingresos"      element={<P Page={Ingresos} />} />
          <Route path="/gastos"        element={<P Page={Gastos} />} />
          <Route path="/presupuesto"   element={<P Page={Presupuesto} />} />
          <Route path="/reportes"      element={<P Page={Reportes} />} />
          <Route path="/inversiones"   element={<P Page={Inversiones} />} />
          <Route path="/configuracion" element={<P Page={Configuracion} />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
