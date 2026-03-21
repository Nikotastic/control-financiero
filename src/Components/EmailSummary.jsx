import React, { useState } from "react";
import { Mail, Send, X } from "lucide-react";

/**
 * Modal para enviar un resumen financiero por email.
 * Usa mailto: para abrir el cliente de correo del usuario,
 * o EmailJS si el usuario configura las keys.
 */
export default function EmailSummary({ financialData, userEmail }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const mesNombre = new Date().toLocaleString("es-ES", { month: "long", year: "numeric" });

  const bodyText = `
RESUMEN FINANCIERO — ${mesNombre.toUpperCase()}
${"─".repeat(40)}

INGRESOS:    $${financialData.ingresos.toLocaleString()}
GASTOS:      $${financialData.gastos.toLocaleString()}
ME DEBEN:    $${(financialData.meDeben || 0).toLocaleString()}
DEUDAS MIAS: $${(financialData.debo || 0).toLocaleString()}
INVERSIONES: $${financialData.inversiones.toLocaleString()}

${"─".repeat(40)}
BALANCE LÍQUIDO ACTUAL: ${financialData.balance >= 0 ? "+" : ""}$${financialData.balance.toLocaleString()}

${financialData.balance >= 0
    ? "¡Excelente trabajo! Tienes saldo positivo y salud financiera buena."
    : "Atención: Cuidado con las deudas o excesos, revisa tus gastos pronto."}

Generado desde Control Financiero
`.trim();

  const handleMailto = () => {
    const subject = encodeURIComponent(`Resumen Financiero — ${mesNombre}`);
    const body    = encodeURIComponent(bodyText);
    const mailto  = `mailto:${userEmail}?subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); }, 2000);
  };

  // EmailJS (si el usuario tiene keys configuradas)
  const emailjsServiceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID || localStorage.getItem("emailjs_service_id") || "";
  const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || localStorage.getItem("emailjs_template_id") || "";
  const emailjsPublicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || localStorage.getItem("emailjs_public_key") || "";
  const hasEmailJS = emailjsServiceId && emailjsTemplateId && emailjsPublicKey;

  const handleEmailJS = async () => {
    setSending(true);
    try {
      const { send } = await import("@emailjs/browser");
      await send(
        emailjsServiceId,
        emailjsTemplateId,
        {
          to_email:  userEmail,
          to_name:   financialData.userName,
          mes:       mesNombre,
          ingresos:  `$${financialData.ingresos.toLocaleString()}`,
          gastos:    `$${financialData.gastos.toLocaleString()}`,
          me_deben:  `$${(financialData.meDeben || 0).toLocaleString()}`,
          debo:      `$${(financialData.debo || 0).toLocaleString()}`,
          balance:   `${financialData.balance >= 0 ? "+" : ""}$${financialData.balance.toLocaleString()}`,
          inversiones: `$${financialData.inversiones.toLocaleString()}`,
          estado:    financialData.balance >= 0 ? "Balance positivo" : "Atención: Balance negativo",
        },
        emailjsPublicKey
      );
      setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      setTimeout(() => { setOpen(false); setSent(false); }, 2000);
    }
  };

  return (
    <>
      <button className="email-trigger-btn" onClick={() => setOpen(true)}>
        <Mail size={15} />
        Enviar resumen
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Mail size={18} /> Resumen por email
              </h3>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {sent ? (
                <div className="modal-sent">
                  <span className="modal-sent-emoji">✓</span>
                  <p>¡Listo! Resumen enviado.</p>
                </div>
              ) : (
                <>
                  <p className="modal-desc" style={{ marginBottom: "20px" }}>
                    Se enviará un resumen de <strong>{mesNombre}</strong> a{" "}
                    <strong>{userEmail}</strong>.
                  </p>

                  <div className="modal-actions">
                    {hasEmailJS ? (
                      <button
                        className="btn-primary"
                        onClick={handleEmailJS}
                        disabled={sending}
                      >
                        <Send size={15} />
                        {sending ? "Enviando…" : "Enviar resumen"}
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleMailto}>
                        <Mail size={15} />
                        Abrir en mi correo
                      </button>
                    )}
                    <button className="btn-ghost" onClick={() => setOpen(false)}>
                      Cancelar
                    </button>
                  </div>

                  {!hasEmailJS && (
                    <p className="modal-hint">
                      Nota: El envío automático sin presionar "Enviar" en tu aplicación de correo solo está disponible si se configuran variables de entorno.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
