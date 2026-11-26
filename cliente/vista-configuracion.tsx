"use client";

import { Bot, Building2, CalendarDays, Globe, Plug, Settings2, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentType, type JSX } from "react";
import type { EstadoPlantilla } from "@/lib/api-tipos";
import type { IdSeccionConfiguracion } from "@/lib/configuracion";
import type { Bd } from "@/lib/tipos";
import { leerPlantillas } from "./api-sistema";
import { confirmar } from "./confirmaciones";
import { BloqueAgenda } from "./configuracion/agenda";
import { useConfiguracion } from "./configuracion/api";
import { BloqueAsistente } from "./configuracion/asistente";
import { Avanzado } from "./configuracion/avanzado";
import { Conexiones } from "./configuracion/conexiones";
import { Bloque, BOTON } from "./configuracion/controles";
import { BloqueEquipo } from "./configuracion/equipo";
import { IconoWhatsApp } from "./configuracion/iconos-modelos";
import { BloqueMcp } from "./configuracion/mcp";
import { BloqueNegocio } from "./configuracion/negocio";
import { Pie } from "./configuracion/pie";
import { BloqueWeb } from "./configuracion/web";
import { irA } from "./navegacion";

type TabAjustes = "negocio" | "asistente" | "agenda" | "whatsapp" | "equipo" | "mcp" | "web" | "avanzado";

const TABS: { id: TabAjustes; nombre: string; Icono: ComponentType<{ className?: string }> }[] = [
  { id: "negocio", nombre: "Negocio", Icono: Building2 },
  { id: "asistente", nombre: "Tu Asistente y Modelos", Icono: Bot },
  { id: "agenda", nombre: "Agenda y Horarios", Icono: CalendarDays },
  { id: "whatsapp", nombre: "WhatsApp / Conexiones", Icono: IconoWhatsApp },
  { id: "equipo", nombre: "Equipo y Usuarios", Icono: Users },
  { id: "mcp", nombre: "Servidor MCP", Icono: Plug },
  { id: "web", nombre: "Web Pública", Icono: Globe },
  { id: "avanzado", nombre: "Avanzado y Datos", Icono: Settings2 },
];

export function VistaConfiguracion(p: { bd: Bd; refrescar: () => Promise<void>; bloque: string | null }): JSX.Element {
  const { bd, refrescar, bloque } = p;
  const { datos, error, recargar } = useConfiguracion(bd.configuracion?.firma);
  const [plantillas, setPlantillas] = useState<EstadoPlantilla[] | null>(null);
  const [informacionNueva, setInformacionNueva] = useState<{ texto: string; vez: number } | null>(null);
  const [tab, setTab] = useState<TabAjustes>((bloque as TabAjustes) || "negocio");

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
    if (bloque && TABS.some((t) => t.id === bloque)) {
      setTab(bloque as TabAjustes);
    }
  }, [bloque]);

  const irABloque = useCallback((id: IdSeccionConfiguracion) => {
    irA("configuracion", { bloque: id });
    if (TABS.some((t) => t.id === id)) setTab(id as TabAjustes);
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

  return (
    <div className="flex w-full flex-col gap-6 pb-10 md:flex-row md:items-start">
      {/* Sub-navegación lateral ordenada */}
      <nav aria-label="Secciones de ajustes" className="flex shrink-0 flex-row gap-1 overflow-x-auto pb-2 md:w-56 md:flex-col md:pb-0">
        {TABS.map(({ id, nombre, Icono }) => {
          const activa = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                activa ? "bg-marca/10 font-semibold text-marca dark:bg-marca/20 dark:text-marca" : "text-secundario hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-tinta"
              }`}
            >
              <Icono className="size-4 shrink-0" />
              <span>{nombre}</span>
            </button>
          );
        })}
      </nav>

      {/* Contenido de la sección seleccionada */}
      <div className="min-w-0 flex-1 space-y-5">
        {tab === "negocio" && (
          <Bloque id="ajustes-negocio" titulo="Configuración del Negocio">
            <BloqueNegocio {...comun} plantillas={plantillas} />
          </Bloque>
        )}

        {tab === "asistente" && (
          <Bloque id="ajustes-asistente" titulo="Tu Asistente y Modelos">
            <BloqueAsistente
              {...comun}
              bd={bd}
              plantillas={plantillas}
              releerPlantillas={releerPlantillas}
              informacionNueva={informacionNueva}
            />
          </Bloque>
        )}

        {tab === "agenda" && (
          <Bloque id="ajustes-agenda" titulo="Agenda y Horarios de Atención">
            <BloqueAgenda {...comun} bd={bd} />
          </Bloque>
        )}

        {tab === "whatsapp" && (
          <Bloque id="ajustes-whatsapp" titulo="WhatsApp y Conexiones">
            <div className="pt-3 pb-4">
              <Conexiones />
            </div>
          </Bloque>
        )}

        {tab === "equipo" && (
          <Bloque id="ajustes-equipo" titulo="Equipo y Usuarios">
            <BloqueEquipo />
          </Bloque>
        )}

        {tab === "mcp" && (
          <Bloque id="ajustes-mcp" titulo="Servidor MCP (Conexión Externa)">
            <BloqueMcp />
          </Bloque>
        )}

        {tab === "web" && (
          <Bloque id="ajustes-web" titulo="Web Pública de Captación">
            <BloqueWeb {...comun} />
          </Bloque>
        )}

        {tab === "avanzado" && (
          <div className="space-y-5">
            <Pie {...comun} />
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
