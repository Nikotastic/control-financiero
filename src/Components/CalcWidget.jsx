import React, { useState, useRef, useEffect } from "react";
import { Calculator, X } from "lucide-react";

const BOTONES = [
  ["C", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

export default function CalcWidget() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBtn = (val) => {
    if (val === "C") {
      setDisplay("0");
      return;
    }
    if (val === "⌫") {
      if (display === "Error" || display === "Infinity") { setDisplay("0"); return; }
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    if (val === "+/-") {
      setDisplay((d) => {
        try {
          const res = new Function('return ' + d.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"))();
          return String(res * -1);
        } catch { return d; }
      });
      return;
    }
    if (val === "%") {
      setDisplay((d) => {
        try {
          const res = new Function('return ' + d.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"))();
          return String(res / 100);
        } catch { return d; }
      });
      return;
    }
    if (val === "=") {
      if (display === "Error") return;
      try {
        const expression = display.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
        let result = new Function('return ' + expression)();
        if (!Number.isFinite(result) || Number.isNaN(result)) throw new Error("");
        setDisplay(String(parseFloat(result.toFixed(8))));
      } catch (e) {
        setDisplay("Error");
      }
      return;
    }
    
    // Concatenar
    const isOp = ["÷", "×", "−", "+", "."].includes(val);
    setDisplay((d) => {
      if (d === "Error" || d === "Infinity" || d === "NaN") return isOp ? "0" + val : val;
      const lastChar = d.slice(-1);
      const isLastOp = ["÷", "×", "−", "+", "."].includes(lastChar);
      
      if (isOp && isLastOp) {
         return d.slice(0, -1) + val;
      }
      
      if (d === "0" && !isOp) return val;
      return d.length < 25 ? d + val : d;
    });
  };

  const isOpUser = (v) => ["÷","×","−","+"].includes(v);

  return (
    <div className="calc-floating" ref={ref}>
      {open && (
        <div className="calc-panel animate-fade-in">
          <div className="calc-header">
            <span>Calculadora</span>
            <button className="calc-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>
          <div className="calc-display" style={{ overflowX: "auto", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "10px", wordBreak: "break-all" }}>
            <span className="calc-value">{display}</span>
          </div>
          <div className="calc-grid">
            {BOTONES.flat().map((btn, i) => (
              <button
                key={i}
                className={`calc-btn ${btn === "C" ? "calc-btn--clear" : ""} ${isOpUser(btn) ? "calc-btn--op" : ""} ${btn === "=" ? "calc-btn--eq" : ""}`}
                onClick={() => handleBtn(btn)}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
      <button className="calc-fab" onClick={() => setOpen(!open)} title="Calculadora flotante">
        {open ? <X size={24} /> : <Calculator size={24} />}
      </button>
    </div>
  );
}
