import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  MessageSquare,
  Plus,
  Clock,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";

const INITIAL_MESSAGE = {
  role: "model",
  text: "¡Hola! Soy tu Mentor Financiero de IA. Conozco el flujo de la app y tu situación actual. ¿Necesitas saber cuál es tu siguiente paso?",
};

const QUICK_ACTIONS = [
  " Analiza mi salud financiera",
  " ¿Dónde gasto más dinero?",
  " Dame un consejo de ahorro nivel Dios",
];

export default function AICoachWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Chat History States
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [view, setView] = useState("chat"); // "chat" | "history"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Basic financial state for context
  const [financialContext, setFinancialContext] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "movimientos"), where("uid", "==", user.uid)),
      (snap) => {
        const data = snap.docs.map((d) => d.data());
        const ingresos = data
          .filter((d) => d.tipo === "Ingreso")
          .reduce((a, b) => a + b.monto, 0);
        const gastos = data
          .filter((d) => d.tipo === "Gasto")
          .reduce((a, b) => a + b.monto, 0);
        setFinancialContext({ ingresos, gastos });
      },
    );
    return () => unsub();
  }, [user?.uid]);

  // Load chat history on mount
  useEffect(() => {
    if (user?.uid) {
      const saved = localStorage.getItem(`ai_chats_v2_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChats(parsed);
          if (parsed.length > 0) {
            setCurrentChatId(parsed[0].id);
            setMessages(parsed[0].messages);
          } else {
            startNewChat();
          }
        } catch (e) {
          startNewChat();
        }
      } else {
        startNewChat();
      }
    }
  }, [user?.uid]);

  // Start a new chat
  const startNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "Nueva conversación",
      date: new Date().toISOString(),
      messages: [INITIAL_MESSAGE],
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([INITIAL_MESSAGE]);
    setView("chat");
  };

  // Sync current messages to the chats array and save to localStorage
  useEffect(() => {
    if (!currentChatId || !user?.uid) return;

    setChats((prevChats) => {
      let isChanged = false;
      const updatedChats = prevChats.map((c) => {
        if (c.id === currentChatId) {
          isChanged = true;
          let newTitle = c.title;
          const userMsgs = messages.filter((m) => m.role === "user");
          if (c.title === "Nueva conversación" && userMsgs.length > 0) {
            newTitle = userMsgs[0].text.substring(0, 25) + "...";
          }
          return { ...c, messages, title: newTitle };
        }
        return c;
      });

      if (isChanged) {
        localStorage.setItem(
          `ai_chats_v2_${user.uid}`,
          JSON.stringify(updatedChats),
        );
      }
      return updatedChats;
    });
  }, [messages, currentChatId, user?.uid]);

  // Borrar un chat con confirmación suave
  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();

    if (confirmDeleteId === chatId) {
      // Segunda vez que toca: borra de verdad
      const remaining = chats.filter((c) => c.id !== chatId);
      setChats(remaining);
      if (user?.uid) {
        localStorage.setItem(
          `ai_chats_v2_${user.uid}`,
          JSON.stringify(remaining),
        );
      }
      if (currentChatId === chatId) {
        if (remaining.length > 0) {
          setCurrentChatId(remaining[0].id);
          setMessages(remaining[0].messages);
        } else {
          startNewChat();
        }
      }
      setConfirmDeleteId(null);
    } else {
      // Primera vez: pide confirmación
      setConfirmDeleteId(chatId);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === chatId ? null : prev));
      }, 3000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open && view === "chat") scrollToBottom();
  }, [messages, loading, open, view]);

  const handleInputInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  const handleSend = async (quickText = null) => {
    const textToSend = typeof quickText === "string" ? quickText : input.trim();
    if (!textToSend || loading) return;

    const userMsg = textToSend;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem("gemini_api_key");

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: " No tienes una API Key de Gemini configurada. No puedo asesorarte ahora mismo.",
        },
      ]);
      setLoading(false);
      return;
    }

    // Si ya tiene ingresos registrados, no lo tratamos como novato
    const isNewbie =
      !financialContext ||
      !financialContext.ingresos ||
      financialContext.ingresos === 0;

    const systemPrompt = isNewbie
      ? `Eres el Mentor Financiero experto de la app dictándole al usuario sus primeros pasos.
Tu propósito es guiarlo a configurar la app.
Dile de forma muy amigable y corta que el primer paso es registrar su Ingreso en la pestaña "Ingresos" y después definir su "Meta de Ahorro" en "Presupuesto".

[Conversación previa]:
${messages.map((m) => `${m.role === "user" ? "Usuario" : "Mentor"}: ${m.text}`).join("\n")}
Usuario: ${userMsg}
Tu respuesta directa (usa estílo Markdown):`
      : `Eres el prestigioso Mentor Financiero integrado en la app de control de gastos.
REGLA DE ORO: El usuario YA TIENE DATOS ACTIVOS. NO le sugieras pasos básicos de novato (como "ve a registrar tus ingresos"), porque ya lleva tiempo usando la app.
Analiza sus números actuales si te pregunta por ellos y dale consejos avanzados.

Su bolsillo hoy:
- Ingresos: $${financialContext?.ingresos?.toLocaleString() || 0}
- Gastos: $${financialContext?.gastos?.toLocaleString() || 0}

Responde de forma directa, conversacional y muy humana (como un amigo experto). Usa Markdown.

[Conversación previa]:
${messages.map((m) => `${m.role === "user" ? "Usuario" : "Mentor"}: ${m.text}`).join("\n")}
Usuario: ${userMsg}
Tu respuesta directa:`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Control Financiero",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "user", content: systemPrompt }],
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        setMessages((prev) => [...prev, { role: "model", text: text.trim() }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Error de conexión con mis servidores." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calc-floating" style={{ right: "100px", zIndex: 999 }}>
      {/* Desplazado a la izquierda de la calculadora con más margen */}
      {open && (
        <div
          className="calc-panel animate-fade-in"
          style={{
            width: "360px",
            display: "flex",
            flexDirection: "column",
            height: "480px",
            boxShadow:
              "0px 20px 40px rgba(0, 0, 0, 0.6), 0px 0px 0px 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "var(--bg-2)",
            borderRadius: "15px",
            overflow: "hidden",
          }}
        >
          <style>
            {`
@keyframes typingBounce {
  0% { transform: translateY(0px) scale(1); opacity: 0.3; }
  50% { transform: translateY(-3px) scale(1.2); opacity: 1; }
  100% { transform: translateY(0px) scale(1); opacity: 0.3; }
}
`}
          </style>
          <div
            className="calc-header"
            style={{
              background: "var(--blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
                fontSize: "1rem",
                color: "white",
              }}
            >
              <Bot size={18} />
              <span>Mentor IA</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="calc-close"
                style={{ color: "white" }}
                onClick={() => setView(view === "history" ? "chat" : "history")}
                title={view === "history" ? "Volver al chat" : "Ver historial"}
              >
                {view === "history" ? (
                  <MessageSquare size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </button>
              <button
                className="calc-close"
                style={{ color: "white" }}
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {view === "history" ? (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "15px",
                background: "var(--bg-2)",
              }}
            >
              <button
                onClick={startNewChat}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "15px",
                }}
              >
                <Plus size={16} /> Nuevo Chat
              </button>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {chats.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "0.85rem",
                      opacity: 0.6,
                      marginTop: "20px",
                    }}
                  >
                    No hay conversaciones previas.
                  </p>
                )}
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setMessages(chat.messages);
                      setView("chat");
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background:
                        chat.id === currentChatId
                          ? "var(--primary)"
                          : "var(--bg-color)",
                      color:
                        chat.id === currentChatId
                          ? "white"
                          : "var(--text-color)",
                      cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {chat.title}
                      </span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                        {new Date(chat.date).toLocaleDateString()}{" "}
                        {new Date(chat.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteClick(e, chat.id)}
                      style={{
                        background:
                          confirmDeleteId === chat.id
                            ? "rgba(248, 90, 90, 0.15)"
                            : "none",
                        border: "none",
                        color:
                          confirmDeleteId === chat.id
                            ? "var(--red)"
                            : chat.id === currentChatId
                              ? "rgba(255,255,255,0.7)"
                              : "var(--red)",
                        cursor: "pointer",
                        padding:
                          confirmDeleteId === chat.id ? "4px 8px" : "4px",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      title="Borrar conversación"
                    >
                      {confirmDeleteId === chat.id ? (
                        <span
                          style={{ fontSize: "0.75rem", fontWeight: "bold" }}
                        >
                          Eliminar
                        </span>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  background: "var(--card-bg)",
                }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      background:
                        m.role === "user"
                          ? "var(--primary)"
                          : "var(--bg-color)",
                      color: m.role === "user" ? "white" : "var(--text-color)",
                      padding: "8px 12px",
                      borderRadius: "15px",
                      maxWidth: "85%",
                      fontSize: "0.85rem",
                      border: "1px solid var(--border-color)",
                      borderTopRightRadius: m.role === "user" ? "0" : "15px",
                      borderTopLeftRadius: m.role === "model" ? "0" : "15px",
                    }}
                  >
                    {m.role === "model" ? (
                      <div style={{ lineHeight: "1.4" }}>
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => (
                              <p
                                style={{ margin: "0.6em 0", lineHeight: "1.5" }}
                                {...props}
                              />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul
                                style={{
                                  paddingLeft: "1.5em",
                                  margin: "0.5em 0",
                                  listStyleType: "disc",
                                }}
                                {...props}
                              />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol
                                style={{
                                  paddingLeft: "1.5em",
                                  margin: "0.5em 0",
                                  listStyleType: "decimal",
                                }}
                                {...props}
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <li
                                style={{ marginBottom: "0.4em" }}
                                {...props}
                              />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong
                                style={{ fontWeight: "700", color: "inherit" }}
                                {...props}
                              />
                            ),
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                ))}
                {loading && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: "10px 14px",
                      background: "var(--bg-3)",
                      borderRadius: "15px",
                      border: "1px solid var(--border)",
                      borderTopLeftRadius: "0",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "var(--text)",
                        borderRadius: "50%",
                        animation: "typingBounce 1s infinite alternate",
                        animationDelay: "0s",
                      }}
                    />
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "var(--text)",
                        borderRadius: "50%",
                        animation: "typingBounce 1s infinite alternate",
                        animationDelay: "0.2s",
                      }}
                    />
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "var(--text)",
                        borderRadius: "50%",
                        animation: "typingBounce 1s infinite alternate",
                        animationDelay: "0.4s",
                      }}
                    />
                  </div>
                )}

                {!loading && messages.length === 1 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "10px",
                      padding: "0 5px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.7,
                        margin: 0,
                        fontWeight: "600",
                      }}
                    >
                      Sugerencias rápidas:
                    </p>
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(action)}
                        style={{
                          background: "var(--bg-3)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div
                style={{
                  padding: "10px",
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  gap: "5px",
                  background: "var(--card-bg)",
                }}
              >
                <textarea
                  ref={inputRef}
                  className="field-sm"
                  rows={1}
                  style={{
                    flex: 1,
                    margin: 0,
                    resize: "none",
                    padding: "8px 12px",
                    lineHeight: "1.4",
                    maxHeight: "100px",
                    overflowY: "auto",
                    borderRadius: "15px",
                  }}
                  placeholder="Escribe aquí..."
                  value={input}
                  onChange={handleInputInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="btn-primary"
                  style={{ padding: "0 10px" }}
                  onClick={handleSend}
                  disabled={loading}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        className="calc-fab"
        style={{ background: "var(--blue)" }}
        onClick={() => setOpen(!open)}
        title="Asesor financiero"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
}
