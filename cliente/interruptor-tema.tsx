"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type JSX } from "react";

export function InterruptorTema(): JSX.Element {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
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
  }, []);

  const alternar = () => {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.classList.toggle("dark", nuevo);
    localStorage.setItem("crm-tema", nuevo ? "oscuro" : "claro");
  };

  if (!montado) {
    return <div className="size-8" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={alternar}
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-white/70 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white/70"
    >
      {oscuro ? (
        <Sun className="size-4 text-amber-300" strokeWidth={2} />
      ) : (
        <Moon className="size-4 text-neutral-300" strokeWidth={2} />
      )}
    </button>
  );
}
