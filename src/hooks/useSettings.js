import { useState, useEffect } from "react";

export function useSettings(uid) {
  const getKey = (key) => `settings_${uid}_${key}`;

  const [alertasActivadas, setAlertasActivadas] = useState(() => {
    if (!uid) return true;
    return localStorage.getItem(getKey("alertas")) !== "off";
  });

  useEffect(() => {
    if (!uid) return;
    const handleStorage = () => {
      setAlertasActivadas(localStorage.getItem(getKey("alertas")) !== "off");
    };
    window.addEventListener("settingsChanged", handleStorage);
    return () => window.removeEventListener("settingsChanged", handleStorage);
  }, [uid]);

  const updateAlertas = (val) => {
    if (!uid) return;
    localStorage.setItem(getKey("alertas"), val);
    setAlertasActivadas(val !== "off");
    window.dispatchEvent(new Event("settingsChanged"));
  };

  return { alertasActivadas, updateAlertas };
}
