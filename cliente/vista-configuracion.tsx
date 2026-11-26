"use client";

import { Bot, Building2, CalendarDays, Globe, KeyRound, Layers, Plug, Settings2, Users, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import type { EstadoPlantilla } from "@/lib/api-tipos";
import { SECCIONES_CONFIGURACION, type IdSeccionConfiguracion } from "@/lib/configuracion";
import type { Bd } from "@/lib/tipos";
import { leerPlantillas } from "./api-sistema";
import { confirmar } from "./confirmaciones";
import { BloqueAgenda } from "./configuracion/agenda";
import { useConfiguracion } from "./configuracion/api";
import { BloqueAsistente } from "./configuracion/asistente";
import { Avanzado } from "./configuracion/avanzado";
import { Conexiones } from "./configuracion/conexiones";
import { Bloque, BOTON, menosMovimiento } from "./configuracion/controles";
import { BloqueEquipo } from "./configuracion/equipo";
import { BloqueMcp } from "./configuracion/mcp";
import { BloqueNegocio } from "./configuracion/negocio";
import { Pie } from "./configuracion/pie";
import { BloqueWeb } from "./configuracion/web";
import { irA } from "./navegacion";

type TabFiltro = "todas" | "negocio" | "asistente" | "agenda" | "whatsapp" | "equipo" | "mcp" | "web" | "avanzado";

interface ItemNav {
  id: TabFiltro;
  nombre: string;
  Icono: LucideIcon;
}

const ITEMS_NAV: ItemNav[] = [
  { id: "todas", nombre: "Ver todo", Icono: Layers },
  { id: "negocio", nombre: "Negocio", Icono: Building2 },
  { id: "asistente", nombre: "Tu Asistente", Icono: Bot },
  { id: "agenda", nombre: "Agenda", Icono: CalendarDays },
  { id: "whatsapp", nombre: "WhatsApp", Icono: KeyRound },
  { id: "equipo", nombre: "Equipo", Icono: Users },
  { id: "mcp", nombre: "MCP", Icono: Plug },
  { id: "web", nombre: "Web", Icono: Globe },
  { id: "avanzado", nombre: "Avanzado", Icono: Settings2 },
];

export function VistaConfiguracion(p: { bd: Bd; refrescar: () => Promise<void>; bloque: string | null }): JSX.Element {
  const { bd, refrescar, bloque } = p;
  const { datos, error, recargar } = useConfiguracion(bd.configuracion?.firma);
  const [plantillas, setPlantillas] = useState<EstadoPlantilla[] | null>(null);
  const [informacionNueva, setInformacionNueva] = useState<{ texto: string; vez: number } | null>(null);
  const [filtro, setFiltro] = useState<TabFiltro>((bloque as TabFiltro) || "todas");

  const releerPlantillas = useCallback(async () => {
    setPlantillas(await leerPlantillas());
  }, []);

  useEffect(() => {
    void releerPlantillas();
  }, [releerPlantillas]);

  const vistos = useRef(new Set<string>());
  useEffect(() => {
    for (const aviso of datos?.avisos ?? []) {
      if (vistos.current.has(aviso)) continue;
      vistos.current.add(aviso);
      confirmar(aviso, { ms: 6_000 });
    }
  }, [datos?.avisos]);

  useEffect(() => {
    if (bloque && ITEMS_NAV.some((t) => t.id === bloque)) {
      setFiltro(bloque as TabFiltro);
    }
  }, [bloque]);

  const irABloque = useCallback((id: IdSeccionConfiguracion) => {
    irA("configuracion", { bloque: id });
    if (ITEMS_NAV.some((t) => t.id === id)) setFiltro(id as TabFiltro);
  }, []);

  if (!datos) {
    return (
      <div className="w-full">
        {error ? (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-[14px] border border-linea bg-white px-6 py-5 dark:bg-lienzo">
            <p className="text-[14px] leading-5 text-tinta">No se han podido cargar los ajustes.</p>
            <button type="button" onClick={() => void recargar()} className={BOTON}>
              Reintentar
            </button>
          </div>
        ) : (
          <p aria-live="polite" className="px-1 py-5 text-[14px] leading-5 text-secundario">
            Cargando ajustes…
          </p>
        )}
      </div>
    );
  }

  const comun = { datos, recargar, refrescar };

  const mostrar = (id: TabFiltro) => filtro === "todas" || filtro === id;

  return (
    <div className="w-full pb-12">
      {/* Barra horizontal de navegación rápida, sin deformar el ancho de las tarjetas */}
      <div className="sticky top-0 z-20 -mx-1 mb-6 bg-lienzo/90 px-1 py-2 backdrop-blur-md">
        <nav aria-label="Secciones de ajustes" className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ITEMS_NAV.map(({ id, nombre, Icono }) => {
            const activa = filtro === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 ${
                  activa
                    ? "bg-tinta text-white shadow-xs dark:bg-white dark:text-black"
                    : "border border-linea bg-white text-secundario hover:bg-black/[0.02] hover:text-tinta dark:bg-lienzo dark:hover:bg-white/[0.03]"
                }`}
              >
                <Icono className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span>{nombre}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenedor vertical con ancho completo y espaciado consistente */}
      <div className="flex flex-col gap-6">
        {mostrar("negocio") && (
          <Bloque id="ajustes-negocio" titulo="Tu Negocio">
            <BloqueNegocio {...comun} plantillas={plantillas} />
          </Bloque>
        )}

        {mostrar("asistente") && (
          <Bloque id="ajustes-asistente" titulo="Tu Asistente y Modelos de IA">
            <BloqueAsistente
              {...comun}
              bd={bd}
              plantillas={plantillas}
              releerPlantillas={releerPlantillas}
              informacionNueva={informacionNueva}
            />
          </Bloque>
        )}

        {mostrar("agenda") && (
          <Bloque id="ajustes-agenda" titulo="Horario de Citas y Agenda">
            <BloqueAgenda {...comun} bd={bd} />
          </Bloque>
        )}

        {mostrar("whatsapp") && (
          <Bloque id="ajustes-whatsapp" titulo="WhatsApp y Conexiones">
            <div className="pt-3 pb-4">
              <Conexiones />
            </div>
          </Bloque>
        )}

        {mostrar("equipo") && (
          <Bloque id="ajustes-equipo" titulo="Equipo y Usuarios">
            <BloqueEquipo />
          </Bloque>
        )}

        {mostrar("mcp") && (
          <Bloque id="ajustes-mcp" titulo="Servidor MCP">
            <BloqueMcp />
          </Bloque>
        )}

        {mostrar("web") && (
          <Bloque id="ajustes-web" titulo="Tu Web Pública">
            <BloqueWeb {...comun} />
          </Bloque>
        )}

        {mostrar("avanzado") && (
          <div className="space-y-6">
            <Bloque id="ajustes-datos" titulo="Datos y Ejemplos">
              <Pie {...comun} />
            </Bloque>

            <Avanzado
              {...comun}
              irABloque={irABloque}
              alGuardarInstrucciones={(texto) => setInformacionNueva((antes) => ({ texto, vez: (antes?.vez ?? 0) + 1 }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
