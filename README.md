# Finanzas - Control de Gastos e Ingresos

Aplicación web para la gestión de finanzas personales, desarrollada en React, con integración a Firebase Firestore y visualización de datos mediante gráficos.

## Características

- Registro y edición de **ingresos** y **gastos**
- Visualización de movimientos recientes
- Gráficos para análisis de ingresos/gastos
- Gestión de **presupuestos** mensuales y por categoría
- Módulo de **inversiones**
- Reportes mensuales y top de gastos
- Navegación SPA con React Router
- Interfaz moderna y responsiva

## Estructura del proyecto

```
finanzas/
│
├── README.md
├── public/
│   └── gastos.ico
│
├── src/
│   ├── Components/
│   │   ├── AgregarMovimiento.jsx
│   │   ├── Dashboard.jsx
│   │   └── Navegation.jsx
│   │
│   ├── firebaseConfig/
│   │   └── firebase.js
│   │
│   ├── Pages/
│   │   ├── Configuracion.jsx
│   │   ├── Gastos.jsx
│   │   ├── Ingresos.jsx
│   │   ├── Inversiones.jsx
│   │   ├── Presupuesto.jsx
│   │   └── Reportes.jsx
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
└── vite.config.js
```

## Instalación

1. Clona el repositorio:
   ```sh
   git clone <https://github.com/Nikotastic/Control-de-Gastos-e-Ingresos.git>
   cd finanzas
   ```

2. Instala las dependencias:
   ```sh
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```sh
   npm run dev
   ```

4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Configuración de Firebase

El proyecto ya incluye la configuración de Firebase en [`src/firebaseConfig/firebase.js`](src/firebaseConfig/firebase.js). Si deseas usar tu propio proyecto de Firebase, reemplaza las credenciales en ese archivo.

## Scripts disponibles

- `npm run dev` — Inicia el servidor de desarrollo
- `npm run build` — Genera la versión de producción
- `npm run preview` — Previsualiza la build de producción
- `npm run lint` — Ejecuta ESLint

## Tecnologías utilizadas

- React 18
- Vite
- Firebase Firestore
- Recharts
- Tailwind CSS (vía CDN)
- Lucide React Icons

## Licencia

© 2025 Nikol Velasquez. Todos los derechos reservados.

---

> Proyecto desarrollado como ejemplo de gestión de finanzas personales.