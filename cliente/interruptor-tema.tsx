"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type JSX } from "react";

export function InterruptorTema(): JSX.Element {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    try {
      const guardado = localStorage.getItem("crm-tema");
      if (guardado) {
        const esOscuro = guardado === "oscuro";
        setOscuro(esOscuro);
        document.documentElement.classList.toggle("dark", esOscuro);
      } else {
        const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setOscuro(prefiereOscuro);
        document.documentElement.classList.toggle("dark", prefiereOscuro);
      }
    } catch {
      // Ignorar errores en navegadores restrictivos
    }
  }, []);

  const alternar = () => {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    if (nuevo) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("crm-tema", "oscuro");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("crm-tema", "claro");
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition-all duration-150 ease-out hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/70"
    >
      {montado && oscuro ? (
        <Sun className="size-4 text-amber-300 transition-transform hover:rotate-45" strokeWidth={2} />
      ) : (
        <Moon className="size-4 text-neutral-300 transition-transform hover:-rotate-12" strokeWidth={2} />
      )}
    </button>
  );
}
