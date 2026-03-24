import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

const FALLBACK_TIPS = [
  "Registra tus gastos diariamente para tener visibilidad total de tu dinero.",
  "Considera la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro.",
  "Define un presupuesto mensual por categoría para evitar sorpresas.",
  "Revisa tus suscripciones cada trimestre — las olvidadas cuestan mucho.",
  "Automatiza un ahorro mínimo mensual antes de gastar el resto.",
];

export default function AIInsights({ financialData }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usado, setUsado] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("gemini_api_key") || "";

  const generateInsight = async () => {
    setLoading(true);
    setError("");

    // Si no hay API key, usar tips predefinidos como fallback
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 800)); // simular carga
      const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      setInsight(tip);
      setUsado(true);
      setLoading(false);
      return;
    }

    const diasTranscurridos = new Date().getDate();
    const dE = new Date();
    const diasEnMes = new Date(dE.getFullYear(), dE.getMonth() + 1, 0).getDate();

    const prompt = `Eres una IA de control financiero predictivo nivel DIOS. Analiza estos datos. Dame UNA recomendación o alerta directa y matemática en 1 o 2 oraciones, respetando las siguientes reglas de comportamiento.

Reglas:
1) Si "Proyección" > "Ingresos" o si (Gastos en Ocio / Ingresos) > 0.25: ALERTA CRÍTICA ("Estás gastando mucho. Reduce ocio o te excederás a fin de mes").
2) Si el "Nivel de ahorro" es < 20% de los Ingresos y el Score es bajo: "Estás comprometiendo tu futuro, tu nivel de ahorro está bajo el 20% mensual".
3) Si el Score es alto (>=80): Elogia su puntuación e incítalo a mantener el ritmo.

Datos en tiempo real (día ${diasTranscurridos} de ${diasEnMes}):
- Ingresos: $${financialData.ingresos.toLocaleString()}
- Gastos actuales: $${financialData.gastos.toLocaleString()}
- Score Financiero global: ${financialData.score}/100
- Proyección computarizada a fin de mes: $${Math.round(financialData.proyeccionMes || 0).toLocaleString()}
- Destinado a Ocio: $${(financialData.gastoOcio || 0).toLocaleString()}
- Destinado a Ahorro/Inversión: $${((financialData.gastoAhorro || 0) + (financialData.inversiones || 0)).toLocaleString()}

Pasa directamente a la acción, sin saludos, con lenguaje moderno tipo fintech.`;

    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Control Financiero",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt }]
          })
        }
      );

      if (!res.ok) {
        let msg = "Ups, algo falló al conectar con la IA.";
        if (res.status === 400) msg = "La petición fue rechazada. Verifica la clave API o el formato.";
        if (res.status === 401 || res.status === 403) msg = "La clave de OpenRouter es inválida o no tiene fondos.";
        if (res.status === 429) msg = "Has alcanzado el límite de consultas de OpenRouter.";
        if (res.status >= 500) msg = "Los servidores de OpenRouter están teniendo problemas.";
        throw new Error(msg);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Respuesta vacía o formato inesperado");
      setInsight(text.trim());
      setUsado(true);
    } catch (err) {
      setError(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <div className="ai-title">
          <Sparkles size={18} className="ai-sparkle" />
          <span>Asistente IA</span>
          <span className="ai-badge">Gemini</span>
        </div>
        <button
          className="ai-refresh-btn"
          onClick={generateInsight}
          disabled={loading}
          title={usado ? "Nuevo consejo" : "Generar consejo"}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          {loading ? "Analizando…" : usado ? "Nuevo" : "Analizar"}
        </button>
      </div>

      <div className="ai-body">
        {!usado && !loading && !error && (
          <div className="ai-placeholder">
            <p className="ai-placeholder-text">
              Pulsa <strong>Analizar</strong> para que la IA revise tus finanzas y te dé un consejo personalizado.
            </p>
            {!apiKey && (
              <p className="ai-key-hint">
                Nota: Sin API key conectada internamente, esta sección funcionará con tips financieros inteligentes en lugar de análisis en tiempo real.
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="ai-loading">
            <div className="ai-dots">
              <span /><span /><span />
            </div>
            <p className="ai-loading-text">Analizando tus finanzas…</p>
          </div>
        )}

        {error && !loading && (
          <div className="ai-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {insight && !loading && !error && (
          <div className="ai-insight">
            <p className="ai-insight-text">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
