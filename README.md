<div align="center">
  <h1>💰 Control Financiero Predictivo</h1>
  <p>Una aplicación web moderna y poderosa para predecir, gestionar y dominar tus finanzas personales, impulsada por IA, algoritmos predictivos y la filosofía de sobres de dinero.</p>
</div>

<br/>

## ✨ Características Principales (Nueva Generación)

Esta aplicación evolucionó de ser un simple "registro histórico de gastos" a convertirse en tu **Director Financiero Personal Intransigente**, construida con un diseño premium (Glassmorphism):

- 🔮 **Motor de Proyección Mensual Computarizado**: La app mide tu velocidad diaria de gasto y proyecta cuánto dinero quemarás a fin de mes. Si el algoritmo detecta que rebasarás tus ingresos, disparará alertas rojas (Sobrepaso proyectado).
- 🏆 **Score Financiero (Gamificación)**: Un puntaje en vivo (0 - 100) que califica tu salud financiera. Pierdes puntos por gastar más del 25% en *Ocio* o si tienes más deudas que liquidez, y ganas puntos si tu tasa de ahorro supera el 20%.
- 🤖 **Mentor IA Flotante (Google Gemini)**: Un chatbot permanente y entrenado que conoce exactamente tu situación financiera en estado de ejecución e interactúa contigo para guiarte paso a paso sobre qué debes hacer para maximizar tu riqueza.
- 🛑 **Sistema Anti-Errores (Freno de Mano de Gastos)**: Calcula automáticamente tu **Dinero Disponible REAL** *(Ingresos - Gastos - Ahorro Bloqueado - Deudas Totales)* y bloquea internamente cualquier intento de gasto que supere este límite con una alerta. Te impide sabotear tus metas.
- ✉️ **Presupuesto Semanal Automático**: Divide matemáticamente tu liquidez disponible diaria o semanal basándose en cuántos días en el calendario le quedan al mes.
- 🧮 **Calculadora Inline Nativa**: Calculadora flotante reescrita desde cero con evaluador de expresiones (soporte nativo de teclado `Numpad`) que te permite ver la ecuación completa de corrido mientras sumas o restas números de tu base de datos.
- 📊 **Cuentas de Crecimiento & Metas Inteligentes**: Configura una Meta de Ahorro inamovible. La app descontará visualmente este "Dinero Invisible" para que sientas presión de pobreza y no te lo gastes.
- 📬 **Reportes por Email Automáticos**: Compila tus KPIs, tu categoría número uno de gastos y un resumen escrito profesional enviado automáticamente vía EmailJS hacia tu correo.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, React Router DOM
- **Estilos**: Vanilla CSS con variables nativas (`index.css`), Dark Mode & Blur
- **Backend & Almacenamiento**: Firebase (Firestore, Authentication OAuth)
- **Gráficos y Visualización**: Recharts
- **Iconografía Completa**: Lucide React
- **Cerebro de Inteligencia Artificial**: `@google/generative-ai` (Gemini 2.0 Flash)
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

Para usar todas las integraciones (Inicios de sesión, IA y Correos), debes crear un archivo `.env` o `.env.local` en la carpeta raíz:

```env
# ─── Firebase (Base de Datos y Autenticación)
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_dominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# ─── Google Gemini IA (Para el Mentor Asesor Predictivo)
# Genera tu token libre en: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=tu_api_key_gemini

# ─── EmailJS (Motor de notificaciones a tu correo)
# Configúralo desde: https://www.emailjs.com/
VITE_EMAILJS_SERVICE_ID=tu_service_id
VITE_EMAILJS_TEMPLATE_ID=tu_template_id
VITE_EMAILJS_PUBLIC_KEY=tu_public_key
```

### Ejecutar Servidor

```bash
# Lanza tu servidor hiper-rápido de Vite
npm run dev
```

La app se abrirá de inmediato en [http://localhost:5173](http://localhost:5173).

## 📁 Estructura Principal del Proyecto

El código está regido por una estructura limpia y optimizada basada en Single Page Application escalable:
- `/src/Pages/` Rutas principales de navegación (Dashboard, Ingresos, Gastos con Sistema Anti-errores, Presupuesto, etc).
- `/src/Components/` Módulos inyectables interactivos interactuando de manera autónoma (`AICoachWidget.jsx`, `CalcWidget.jsx`, `AIInsights.jsx`, gráficos).
- `/src/context/` Manejo global del estado de sesión y seguridad (Firebase Auth Context).
- `/src/hooks/` Central de utilidades y disparadores lógicos (`useAlerts.js` para los banners de sobre-gasto).

---
<div align="center">
  Arquitectura Rediseñada y Desarrollada por Nikol Velasquez.<br/>
  © 2026. Todos los derechos reservados.
</div>