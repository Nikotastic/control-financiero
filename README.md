<div align="center">
  <h1>💰 Control Financiero Inteligente</h1>
  <p>Una aplicación web moderna y potente para gestionar tus finanzas personales, impulsada por IA y reportes automáticos.</p>
</div>

<br/>

## ✨ Características Principales

Esta aplicación fue construida pensando en una experiencia de usuario premium, un diseño hermoso oscuro y funcionalidades rápidas:

- 📊 **Dashboard Interactivo**: Gráficos dinámicos y métricas en tiempo real sobre tus hábitos de consumo y balance neto.
- 🤖 **Asistente Financiero de IA**: Integrado con Google Gemini para analizar tu comportamiento financiero en tiempo real y darte consejos o correcciones personalizadas.
- 📬 **Reportes Automáticos por Correo**: Integración directa con EmailJS para compilar un reporte mensual de tu contabilidad y enviarlo directamente a tu bandeja de entrada con un diseño HTML profesional.
- 🔔 **Centro de Alertas Inteligente**: Sistema inteligente de notificaciones flotantes (con "Firma" de historial) que se acciona automáticamente para avisarte si estás malgastando tu dinero en alguna categoría, si rompiste tu presupuesto mensual o para felicitarte por ahorrar.
- 🎯 **Gestión de Presupuestos**: Establece metas de gasto mensual y recorta lo innecesario con barras de progreso.
- 📉 **Ingresos, Gastos e Inversiones**: Registra todo con actualizaciones instantáneas gracias a sincronización remota NoSQL.
- 🔐 **Autenticación Nativa**: Inicio de sesión de un solo clic mediante Google (OAuth) a través de Firebase. Tu dinero y datos jamás se cruzarán con los de otro usuario.
- 🧮 **Herramientas de Apoyo**: Calculadora flotante (FAB Mode) de libre acceso escondida en toda la app para sacar tus cuentas rápido.
- 🌙 **Diseño Dark Mode & Glassmorphism**: Interfaz fluida con desenfoques de fondo de alta calidad, botones elegantes, zero dependencias pesadas de UI, y transiciones rápidas.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, React Router DOM
- **Estilos**: Vanilla CSS con variables nativas (`index.css`)
- **Backend & DB**: Firebase (Firestore, Authentication)
- **Gráficos**: Recharts
- **Iconografía**: Lucide React
- **Inteligencia Artificial**: `@google/generative-ai` (Gemini 2.0 Flash)
- **Email Serverless**: `@emailjs/browser`

## 🚀 Instalación y Configuración

```bash
# 1. Clona el repositorio
git clone https://github.com/Nikotastic/Control-de-Gastos-e-Ingresos.git
cd Control-de-Gastos-e-Ingresos

# 2. Instala las dependencias
npm install
```

### 🗝️ Variables de Entorno (.env)

Para que todos los super-poderes de la aplicación funcionen, debes renombrar o crear un archivo `.env` o `.env.local` en la raíz basándote en este mapa:

```env
# ─── Firebase (Base de Datos y Autenticación)
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_dominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# ─── Google Gemini IA (Para el asistente del Dashboard)
# Puedes sacarla gratis en: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=tu_api_key_gemini

# ─── EmailJS (Para envíos masivos de facturación y resumen)
# Puedes generar tu token en: https://www.emailjs.com/
VITE_EMAILJS_SERVICE_ID=tu_service_id
VITE_EMAILJS_TEMPLATE_ID=tu_template_id
VITE_EMAILJS_PUBLIC_KEY=tu_public_key
```

### Ejecutar Localmente

```bash
# Arranca el servidor local ultrarápido con Vite
npm run dev
```

La app estará disponible al instante en [http://localhost:5173](http://localhost:5173)

## 📁 Estructura del Código

El proyecto sigue una arquitectura concisa y modular:
- `/src/Pages/` contiene las rutas principales (Dashboard, Ingresos, Configuracion, Login, Reportes, etc).
- `/src/Components/` aloja la lógica visual reutilizable (Widgets, Navbar interactivo, Componentes de IA, Gráficos).
- `/src/context/` maneja el estado global del usuario activo (Auth)
- `/src/hooks/` centraliza custom hooks de alta complejidad matemática cómo `useAlerts.js` (análisis financiero oculto) o `useSettings.js` (Manejo de estados con eventos locales).

---
<div align="center">
  Diseñado y desarrollado por Nikol Velasquez. <br/>
  © 2026. Todos los derechos reservados.
</div>