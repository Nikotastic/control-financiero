import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";

/**
 * Hook que analiza los datos financieros y genera alertas inteligentes.
 * Detecta: balance negativo, gastos excesivos, presupuesto superado, etc.
 */
export function useAlerts(user) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "movimientos"), where("uid", "==", user.uid)),
      async (snap) => {
        const movs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        movs.sort((a, b) => b.fecha.seconds - a.fecha.seconds);

        // Obtener el mes actual
        const now = new Date();
        const mesKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Filtrar movimientos del mes actual
        const delMes = movs.filter((m) => {
          if (!m.fecha) return false;
          const f = new Date(m.fecha.seconds * 1000);
          return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}` === mesKey;
        });

        const ingresos = delMes.filter((m) => m.tipo === "Ingreso").reduce((a, m) => a + m.monto, 0);
        const gastos   = delMes.filter((m) => m.tipo === "Gasto").reduce((a, m) => a + m.monto, 0);
        const balance  = ingresos - gastos;

        // Obtener presupuesto mensual si existe
        let presupuesto = null;
        try {
          const pSnap = await getDoc(doc(db, "presupuesto", `${user.uid}_${mesKey}`));
          if (pSnap.exists()) presupuesto = pSnap.data().monto;
        } catch (_) {}

        const nuevasAlertas = [];

        // 1. Balance negativo
        if (balance < 0) {
          nuevasAlertas.push({
            id: "balance-negativo",
            tipo: "critical",
            titulo: "Balance negativo",
            mensaje: `Tus gastos superan tus ingresos por $${Math.abs(balance).toLocaleString()} este mes.`,
            icono: "!",
            accion: "/gastos",
            accionLabel: "Ver gastos",
          });
        }

        // 2. Gastos muy altos respecto a ingresos
        else if (ingresos > 0 && gastos / ingresos >= 0.85) {
          nuevasAlertas.push({
            id: "gastos-altos",
            tipo: "warning",
            titulo: "Gastos elevados",
            mensaje: `Llevas gastado el ${((gastos / ingresos) * 100).toFixed(0)}% de tus ingresos este mes.`,
            icono: "i",
            accion: "/gastos",
            accionLabel: "Revisar gastos",
          });
        }

        // 3. Presupuesto superado
        if (presupuesto && gastos > presupuesto) {
          nuevasAlertas.push({
            id: "presupuesto-superado",
            tipo: "critical",
            titulo: "Presupuesto superado",
            mensaje: `Superaste tu presupuesto mensual de $${presupuesto.toLocaleString()} por $${(gastos - presupuesto).toLocaleString()}.`,
            icono: "!",
            accion: "/presupuesto",
            accionLabel: "Ver presupuesto",
          });
        }

        // 4. Presupuesto al 80%
        else if (presupuesto && gastos / presupuesto >= 0.8) {
          nuevasAlertas.push({
            id: "presupuesto-80",
            tipo: "warning",
            titulo: "Cerca del límite",
            mensaje: `Usaste el ${((gastos / presupuesto) * 100).toFixed(0)}% de tu presupuesto. Quedan $${(presupuesto - gastos).toLocaleString()}.`,
            icono: "i",
            accion: "/presupuesto",
            accionLabel: "Ver presupuesto",
          });
        }

        // 5. Sin ingresos este mes
        if (ingresos === 0 && delMes.length > 0) {
          nuevasAlertas.push({
            id: "sin-ingresos",
            tipo: "info",
            titulo: "Sin ingresos registrados",
            mensaje: "No tienes ingresos registrados este mes. ¿Olvidaste agregar alguno?",
            icono: "?",
            accion: "/ingresos",
            accionLabel: "Agregar ingreso",
          });
        }

        // 6. Gasto único muy grande (mayor al 40% de ingresos del mes)
        if (ingresos > 0) {
          const gastoGrande = delMes.find(
            (m) => m.tipo === "Gasto" && m.monto >= ingresos * 0.4
          );
          if (gastoGrande) {
            nuevasAlertas.push({
              id: `gasto-grande-${gastoGrande.id}`,
              tipo: "info",
              titulo: "Gasto inusualmente grande",
              mensaje: `"${gastoGrande.descripcion}" representa el ${((gastoGrande.monto / ingresos) * 100).toFixed(0)}% de tus ingresos del mes.`,
              icono: "i",
              accion: "/gastos",
              accionLabel: "Ver gastos",
            });
          }
        }

        if (nuevasAlertas.length === 0 && ingresos > 0) {
          nuevasAlertas.push({
            id: "saludable",
            tipo: "success",
            titulo: "Finanzas saludables",
            mensaje: `Llevas un mes excelente. Tu balance positivo es $${balance.toLocaleString()}.`,
            icono: "✓",
          });
        }

        setAlerts(nuevasAlertas);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  return alerts;
}
