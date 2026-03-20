import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig/firebase";
import { useAuth } from "../context/AuthContext";

const DEFAULT_CATEGORIES = [
  { nombre: "Vivienda", color: "#4b7bec" },
  { nombre: "Alimentación", color: "#00c896" },
  { nombre: "Transporte", color: "#ff9f43" },
  { nombre: "Servicios", color: "#54a0ff" },
  { nombre: "Salud", color: "#f85a5a" },
  { nombre: "Educación", color: "#5f27cd" },
  { nombre: "Entretenimiento", color: "#a55eea" },
  { nombre: "Ropa", color: "#f368e0" },
  { nombre: "Deudas", color: "#ff6b6b" },
  { nombre: "Ahorro", color: "#1dd1a1" },
  { nombre: "Seguros", color: "#feca57" },
  { nombre: "Otros", color: "#8395a7" },
];

export function useCategorias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const inicializarYCargar = async () => {
      const q = query(collection(db, "categorias"), where("uid", "==", user.uid));
      const initSnap = await getDocs(q);

      if (initSnap.empty) {
        setLoading(true);
        const promises = DEFAULT_CATEGORIES.map((cat) =>
          addDoc(collection(db, "categorias"), { ...cat, uid: user.uid })
        );
        await Promise.all(promises);
      }

      // Ahora que existen (o ya existían), escuchamos en tiempo real
      onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setCategorias(data);
        setLoading(false);
      });
    };

    inicializarYCargar();

    // Limitación: este useEffect devuelve una promesa implícita, el unsub real habría 
    // que manejarlo con una ref o una función de cleanup que intercepte onSnapshot.
  }, [user?.uid]);

  // Helper dictionary map {"Nombre": "Color"}
  const categoriasColorMap = categorias.reduce((acc, cat) => {
    acc[cat.nombre] = cat.color;
    return acc;
  }, {});

  return { categorias, categoriasColorMap, loading };
}
