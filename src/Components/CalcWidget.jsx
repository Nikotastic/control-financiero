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
  const [prevVal, setPrevVal] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
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
      setPrevVal(null);
      setOperator(null);
      setWaitingForOperand(false);
      return;
    }
    if (val === "⌫") {
      setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    if (val === "+/-") {
      setDisplay((d) => (parseFloat(d) * -1).toString());
      return;
    }
    if (val === "%") {
      setDisplay((d) => (parseFloat(d) / 100).toString());
      return;
    }
    if (["÷", "×", "−", "+"].includes(val)) {
      setPrevVal(parseFloat(display));
      setOperator(val);
      setWaitingForOperand(true);
      return;
    }
    if (val === "=") {
      if (operator && prevVal !== null) {
        const curr = parseFloat(display);
        let result = curr;
        switch (operator) {
          case "+": result = prevVal + curr; break;
          case "−": result = prevVal - curr; break;
          case "×": result = prevVal * curr; break;
          case "÷": result = curr !== 0 ? prevVal / curr : "Error"; break;
        }
        setDisplay(typeof result === "number" ? parseFloat(result.toFixed(10)).toString() : result);
        setPrevVal(null);
        setOperator(null);
        setWaitingForOperand(false);
      }
      return;
    }
    if (val === ".") {
      if (waitingForOperand) { setDisplay("0."); setWaitingForOperand(false); return; }
      if (!display.includes(".")) setDisplay((d) => d + ".");
      return;
    }
    if (waitingForOperand) {
      setDisplay(val);
      setWaitingForOperand(false);
    } else {
      setDisplay((d) => (d === "0" ? val : d.length < 12 ? d + val : d));
    }
  };

  const isOp = (v) => ["÷","×","−","+"].includes(v);

  return (
    <div className="calc-floating" ref={ref}>
      {open && (
        <div className="calc-panel animate-fade-in">
          <div className="calc-header">
            <span>Calculadora</span>
            <button className="calc-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>
          <div className="calc-display">
            {operator && <span className="calc-op-hint">{prevVal} {operator}</span>}
            <span className="calc-value">{display.length > 10 ? parseFloat(parseFloat(display).toPrecision(8)).toString() : display}</span>
          </div>
          <div className="calc-grid">
            {BOTONES.flat().map((btn, i) => (
              <button
                key={i}
                className={`calc-btn ${btn === "C" ? "calc-btn--clear" : ""} ${isOp(btn) ? "calc-btn--op" : ""} ${btn === "=" ? "calc-btn--eq" : ""}`}
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
