"use client";

import { ArrowRight, Search, UserPlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { buscar } from "@/lib/buscar";
import { esEjemplo } from "@/lib/negocio";
import type { Lead } from "@/lib/tipos";
import { normalizar, resumenDatos } from "@/lib/vocabulario";
import { abrirAltaCliente } from "./alta-cliente";
import { abrirCliente, irA, type Vista } from "./navegacion";
import { useEtapas, useFrases, useNegocio } from "./negocio";
import { Avatar } from "./piezas";

// Buscar (⌘K o Ctrl K, o el campo de la barra lateral): funcionalidades, secciones y clientes.
// Permite navegar con flechitas y pulsar Enter para ir a donde corresponde, o añadir un cliente nuevo.

export interface SeccionPaleta {
  id: Vista;
  nombre: string;
  bloque?: string;
  palabras?: string;
  descripcion?: string;
  icono?: ComponentType<{ className?: string }>;
  accion?: () => void;
}

const RECIENTES = 6;
const MAXIMO = 8;
const MAXIMO_SECCIONES_SUGERIDAS = 6;
const LETRA = /\p{L}/u;

const PUNTO_TONO = { gris: "bg-nuevo", ok: "bg-ok", atencion: "bg-atencion" } as const;

type Resultado =
  | { tipo: "lead"; lead: Lead }
  | { tipo: "seccion"; seccion: SeccionPaleta }
  | { tipo: "alta"; texto: string };

interface Props {
  abierta: boolean;
  /** Lo que ya se había escrito en el campo de la barra lateral. */
  inicial: string;
  cerrar: () => void;
  leads: Lead[];
  secciones: SeccionPaleta[];
}

export function Paleta(props: Props) {
  if (!props.abierta) return null;
  return createPortal(<Contenido {...props} />, document.body);
}

function Contenido({ inicial, cerrar, leads, secciones }: Props) {
  const { cfg } = useNegocio();
  const frases = useFrases();
  const etapas = useEtapas();
  const [consulta, setConsulta] = useState(inicial);
  const [activo, setActivo] = useState(0);
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);

  // Al cerrar sin elegir nada (Escape, clic fuera o ⌘K otra vez), el foco vuelve a donde estaba.
  const previo = useRef<Element | null>(typeof document !== "undefined" ? document.activeElement : null);
  const eligio = useRef(false);
  useEffect(() => {
    const anterior = previo.current;
    return () => {
      if (!eligio.current && anterior instanceof HTMLElement && anterior.isConnected) requestAnimationFrame(() => anterior.focus());
    };
  }, []);

  // Escape cierra de inmediato el buscador desde cualquier lugar de la ventana.
  useEffect(() => {
    const alEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cerrar();
      }
    };
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [cerrar]);

  // Lo que venía escrito de la barra lateral: se sigue escribiendo detrás y el foco se coloca firmemente en el input.
  useEffect(() => {
    const enfocar = () => {
      const e = entrada.current;
      if (!e) return;
      e.focus({ preventScroll: true });
      e.setSelectionRange(e.value.length, e.value.length);
    };
    enfocar();
    const t = requestAnimationFrame(enfocar);
    return () => cancelAnimationFrame(t);
  }, []);

  const texto = consulta.trim();
  const q = normalizar(texto);

  // Clientes coincidentes o recientes
  const clientes = q
    ? buscar(leads, texto, { campos: cfg.campos, max: MAXIMO })
    : [...leads].sort((a, b) => b.actualizadoEn - a.actualizadoEn).slice(0, RECIENTES);

  // Funcionalidades coincidentes o sugeridas
  const deSecciones = q
    ? secciones.filter((s) => {
        const n = normalizar(s.nombre);
        const p = s.palabras ? normalizar(s.palabras) : "";
        const d = s.descripcion ? normalizar(s.descripcion) : "";
        const b = s.bloque ? normalizar(s.bloque) : "";
        return n.includes(q) || p.includes(q) || d.includes(q) || b.includes(q);
      })
    : secciones.slice(0, MAXIMO_SECCIONES_SUGERIDAS);

  const rAlta: Resultado | null =
    q && clientes.length === 0 ? { tipo: "alta", texto } : null;

  const resultados: Resultado[] = [
    ...deSecciones.map((seccion): Resultado => ({ tipo: "seccion", seccion })),
    ...clientes.map((lead): Resultado => ({ tipo: "lead", lead })),
    ...(rAlta ? [rAlta] : []),
  ];

  const seleccionado = Math.min(activo, Math.max(resultados.length - 1, 0));

  // Asegura que el elemento activo por teclado esté a la vista en la lista scrolleable
  useEffect(() => {
    const el = document.getElementById(`${id}-${seleccionado}`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [id, seleccionado]);

  const elegir = (r: Resultado) => {
    eligio.current = true;
    cerrar();
    if (r.tipo === "lead") {
      abrirCliente(r.lead.id);
    } else if (r.tipo === "seccion") {
      if (r.seccion.accion) {
        r.seccion.accion();
      } else {
        irA(r.seccion.id, r.seccion.bloque ? { bloque: r.seccion.bloque } : undefined);
      }
    } else if (!LETRA.test(r.texto) && r.texto.replace(/\D/g, "").length >= 3) {
      abrirAltaCliente({ telefono: r.texto });
    } else {
      abrirAltaCliente({ nombre: r.texto });
    }
  };

  const alPulsar = (evento: KeyboardEvent) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActivo((prev) => (prev + 1 < resultados.length ? prev + 1 : 0));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActivo((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(resultados.length - 1, 0)));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      const r = resultados[seleccionado];
      if (r) elegir(r);
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      cerrar();
    }
  };

  const claseFila = (marcado: boolean) =>
    `flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-left max-lg:min-h-12 transition-colors duration-100 ease-out ${
      marcado ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
    }`;

  const fila = (r: Resultado, indice: number) => {
    const marcado = indice === seleccionado;
    const comun = {
      id: `${id}-${indice}`,
      role: "option" as const,
      "aria-selected": marcado,
      onClick: () => elegir(r),
      onMouseEnter: () => setActivo(indice),
      className: claseFila(marcado),
    };

    if (r.tipo === "lead") {
      const etapa = etapas[r.lead.estado];
      const detalle = [r.lead.zona, resumenDatos(r.lead, cfg.campos)].filter(Boolean).join(" · ");
      return (
        <li key={`lead-${r.lead.id}`} {...comun}>
          <Avatar nombre={r.lead.nombre} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[14px] leading-5 font-medium">{r.lead.nombre}</span>
              {esEjemplo(r.lead) && (
                <span className="shrink-0 rounded-[4px] bg-fondo dark:bg-white/10 px-1.5 text-[11px] leading-4 text-secundario">
                  Ejemplo
                </span>
              )}
            </span>
            <span className="block truncate text-[12px] leading-4 text-secundario">{detalle}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] leading-4 text-secundario">
            <span aria-hidden className={`size-1.5 rounded-full ${PUNTO_TONO[etapa.tono]}`} />
            {etapa.nombre}
          </span>
        </li>
      );
    }

    if (r.tipo === "alta") {
      return (
        <li key="alta-nuevo-cliente" {...comun}>
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fondo dark:bg-white/10 text-tinta">
            <UserPlus className="size-4" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] leading-5 font-medium">
            Añadir «{r.texto}» como {frases.cliente.toLowerCase()}
          </span>
          <span className="shrink-0 text-[12px] leading-4 text-secundario">Crear</span>
        </li>
      );
    }

    const s = r.seccion;
    const Icono = s.icono ?? ArrowRight;
    const claveSeccion = `sec-${s.id}-${s.bloque ?? s.nombre}`;

    return (
      <li key={claveSeccion} {...comun}>
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-fondo dark:bg-white/10 text-tinta">
          <Icono className="size-4 text-secundario" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] leading-5 font-medium">{s.nombre}</span>
          {s.descripcion && <span className="block truncate text-[12px] leading-4 text-secundario">{s.descripcion}</span>}
        </span>
        <span className="shrink-0 text-[12px] leading-4 text-secundario">Ir</span>
      </li>
    );
  };

  const titulo = (texto: string) => (
    <li role="presentation" className="px-3 pt-2 pb-1 text-[12px] leading-4 font-semibold uppercase tracking-wider text-secundario">
      {texto}
    </li>
  );

  return (
    // En una pantalla estrecha ocupa toda la pantalla: el campo arriba y los resultados debajo.
    <div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/40 px-4 pt-[14vh] backdrop-blur-xs max-lg:p-0" onMouseDown={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        onMouseDown={(evento) => evento.stopPropagation()}
        className="w-full max-w-[620px] overflow-hidden rounded-[16px] bg-white dark:bg-[#18181b] border border-linea shadow-[0_16px_48px_rgba(0,0,0,0.22)] max-lg:flex max-lg:h-[100dvh] max-lg:max-w-none max-lg:flex-col max-lg:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-linea px-4 max-lg:shrink-0 max-lg:pr-1.5">
          <Search aria-hidden className="size-[18px] shrink-0 text-secundario" strokeWidth={1.75} />
          <input
            ref={entrada}
            autoFocus
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setActivo(0);
            }}
            onKeyDown={alPulsar}
            placeholder="Buscar cliente o funcionalidad…"
            aria-label="Buscar cliente o funcionalidad"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={`${id}-lista`}
            aria-activedescendant={resultados.length ? `${id}-${seleccionado}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-tinta outline-none placeholder:text-secundario"
          />
          <kbd className="shrink-0 rounded-[6px] border border-linea px-1.5 py-0.5 font-mono text-[11px] text-secundario max-lg:hidden">Esc</kbd>
          {/* Sin teclado no hay Escape: en el móvil, una ✕ para cerrar. */}
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-secundario hover:bg-lienzo hover:text-tinta focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-tinta lg:hidden"
          >
            <X aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2 max-lg:max-h-none max-lg:min-h-0 max-lg:flex-1">
          {resultados.length === 0 ? (
            <p className="px-3 py-6 text-center text-[14px] text-secundario">Sin coincidencias para «{texto}».</p>
          ) : (
            <ul id={`${id}-lista`} role="listbox" aria-label="Resultados" className="flex flex-col gap-0.5">
              {deSecciones.length > 0 && (
                <>
                  {titulo(q ? "Funcionalidades" : "Funcionalidades sugeridas")}
                  {deSecciones.map((s, i) => fila({ tipo: "seccion", seccion: s }, i))}
                </>
              )}
              {clientes.length > 0 && (
                <>
                  {titulo(q ? frases.seccionClientes : "Clientes recientes")}
                  {clientes.map((lead, i) => fila({ tipo: "lead", lead }, deSecciones.length + i))}
                </>
              )}
              {rAlta && (
                <>
                  {titulo("Acciones")}
                  {fila(rAlta, deSecciones.length + clientes.length)}
                </>
              )}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-linea px-4 py-2.5 text-[12px] leading-4 text-secundario max-lg:hidden">
          <div className="flex items-center gap-4">
            <span>↑ ↓ para moverte</span>
            <span>Enter para seleccionar</span>
            <span>Esc para cerrar</span>
          </div>
          <span className="text-[11px] tabular-nums">
            {seleccionado + 1} de {resultados.length}
          </span>
        </div>
      </div>
    </div>
  );
}
