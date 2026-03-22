import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";

export default function AICoachWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", text: "¡Hola! Soy tu Mentor Financiero de IA. Conozco el flujo de la app y tu situación actual. ¿Necesitas saber cuál es tu siguiente paso?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Basic financial state for context
  const [financialContext, setFinancialContext] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(query(collection(db, "movimientos"), where("uid", "==", user.uid)), (snap) => {
      const data = snap.docs.map(d => d.data());
      const ingresos = data.filter(d => d.tipo === "Ingreso").reduce((a,b)=>a+b.monto, 0);
      const gastos = data.filter(d => d.tipo === "Gasto").reduce((a,b)=>a+b.monto, 0);
      setFinancialContext({ ingresos, gastos });
    });
    return () => unsub();
  }, [user?.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("gemini_api_key");

    if (!apiKey) {
      setMessages(prev => [...prev, { role: "model", text: "⚠️ No tienes una API Key de Gemini configurada. No puedo asesorarte ahora mismo." }]);
      setLoading(false);
      return;
    }

    // Contexto poderoso
    const systemPrompt = `Eres el Mentor Financiero experto integrado en la app dictándole al usuario los pasos del método de "Riqueza".
Tu propósito es guiar al usuario a entender qué tiene que hacer físicamente en la app.
Reglas del flujo de la app que debes enseñar:
1) Día 1: El usuario debe registrar su Ingreso en la pestaña "Ingresos". Luego, ir a la pestaña "Presupuesto" y escribir su "Meta de Ahorro" (ej. 20% del sueldo) para que la app separe ese dinero.
2) Día a Día: El usuario va a la pestaña "Gastos", que le muestra su "Dinero Disponible REAL". Solo debe basarse en ese límite semanal. Si gasta más, la app se lo impedirá (Sistema Anti-errores).
3) Manejo de deudas: Nunca deben superar el balance líquido. Que las anote en la pestaña "Deudas".
Responde la duda del usuario de forma directa, corta, al grano y anímalo.
Contexto técnico actual del usuario: Ha ingresado históricamente $${financialContext?.ingresos?.toLocaleString() || 0} y ha gastado $${financialContext?.gastos?.toLocaleString() || 0}.

[Conversación previa del usuario y tú]:
${messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Mentor'}: ${m.text}`).join("\n")}
Usuario: ${userMsg}

Da solo tu respuesta directa al último mensaje del usuario, en tono conversacional y educando en el uso de la app.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
          }),
        }
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setMessages(prev => [...prev, { role: "model", text: text.trim() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "model", text: "Error de conexión con mis servidores. 💥" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calc-floating" style={{ right: "80px" }}> {/* Desplazado a la izquierda de la calc */}
      {open && (
        <div className="calc-panel animate-fade-in" style={{ width: "320px", display: "flex", flexDirection: "column", height: "450px" }}>
          <div className="calc-header" style={{ background: "var(--blue)" }}>
            <span style={{ display:"flex", alignItems:"center", gap:"5px" }}><Bot size={16}/> Mentor IA</span>
            <button className="calc-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "10px", background: "var(--card-bg)" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--primary)" : "var(--bg-color)",
                color: m.role === "user" ? "white" : "var(--text-color)",
                padding: "8px 12px", borderRadius: "10px", maxWidth: "85%", fontSize: "0.85rem",
                border: "1px solid var(--border-color)", borderTopRightRadius: m.role==="user"?"0":"10px", borderTopLeftRadius: m.role==="model"?"0":"10px"
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
               <div style={{ alignSelf: "flex-start", padding: "8px 12px", background: "var(--bg-color)", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid var(--border-color)", borderTopLeftRadius: "0" }}>
                 <Loader2 size={16} className="spin" />
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "10px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "5px", background: "var(--card-bg)" }}>
            <input 
              type="text" 
              className="field-sm" 
              style={{ flex: 1, margin: 0 }}
              placeholder="Pregúntame tu siguiente paso..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="btn-primary" style={{ padding: "0 10px" }} onClick={handleSend} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button className="calc-fab" style={{ background: "var(--blue)" }} onClick={() => setOpen(!open)} title="Asesor financiero">
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
}
