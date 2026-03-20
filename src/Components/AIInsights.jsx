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

    const prompt = `Eres un asesor financiero personal amigable y experto. Analiza estos datos financieros de un usuario y da UN consejo práctico y personalizado en 2-3 oraciones en español. Sé específico con los números.

Datos del mes actual:
- Ingresos totales: $${financialData.ingresos.toLocaleString()}
- Gastos totales: $${financialData.gastos.toLocaleString()}
- Balance neto: $${financialData.balance.toLocaleString()}
- Inversiones registradas: $${financialData.inversiones.toLocaleString()}
- Número de transacciones: ${financialData.numMovimientos}
${financialData.categoriaTopGasto ? `- Categoría con más gasto: ${financialData.categoriaTopGasto}` : ""}

Da solo el consejo, sin saludos ni titulares.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
          }),
        }
      );

      if (!res.ok) {
        let msg = "Ups, algo falló al conectar con la IA.";
        if (res.status === 400) msg = "La clave API es inválida o tiene un formato incorrecto.";
        if (res.status === 403 || res.status === 401) msg = "La clave API no tiene los permisos necesarios.";
        if (res.status === 429) msg = "Has alcanzado el límite consultas de la IA. Por favor, intenta de nuevo en un minuto.";
        if (res.status >= 500) msg = "Los servidores de Google Gemini están teniendo problemas. Intenta más tarde.";
        throw new Error(msg);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Respuesta vacía");
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
