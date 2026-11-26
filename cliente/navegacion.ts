import { useSyncExternalStore } from "react";
import { SECCIONES_CONFIGURACION, type IdSeccionConfiguracion } from "@/lib/configuracion";

// La sección del panel vive en la URL: /panel, #clientes, #agenda, #ajustes[-negocio|-web|-asistente|-horario|-conexiones]
// y ?cliente={id}. Al recargar se queda donde estaba. W11 la hace suya en la fase 3; las firmas no cambian.

export type Vista = "hoy" | "clientes" | "productos" | "ventas" | "agenda" | "configuracion";
export interface Ubicacion {
  vista: Vista;
  cliente: string | null;
  bloque: string | null;
}

const INICIO: Ubicacion = Object.freeze({ vista: "hoy", cliente: null, bloque: null });

export function leerUbicacion(url?: string): Ubicacion {
  if (url === undefined) {
    if (typeof window === "undefined") return { ...INICIO };
    url = window.location.href;
  }
  let u: URL;
  try {
    u = new URL(url, "http://localhost");
  } catch {
    return { ...INICIO };
  }
  let ancla = u.hash.replace(/^#/, "");
  let cliente = u.searchParams.get("cliente");
  // «/panel#agenda?cliente=…», escrito a mano: el parámetro va detrás del #.
  const interrogacion = ancla.indexOf("?");
  if (interrogacion >= 0) {
    cliente ||= new URLSearchParams(ancla.slice(interrogacion + 1)).get("cliente");
    ancla = ancla.slice(0, interrogacion);
  }
  const conCliente = cliente ? cliente : null;
  if (ancla === "clientes" || ancla === "productos" || ancla === "ventas" || ancla === "agenda") {
    return { vista: ancla, cliente: conCliente, bloque: null };
  }
  if (ancla === "ajustes") return { vista: "configuracion", cliente: conCliente, bloque: null };
  if (ancla.startsWith("ajustes-")) {
    const sub = ancla.slice("ajustes-".length);
    const seccion = SECCIONES_CONFIGURACION.find((s) => s.ancla === sub);
    return { vista: "configuracion", cliente: conCliente, bloque: seccion ? seccion.id : sub };
  }
  return { vista: "hoy", cliente: conCliente, bloque: null };
}

/** La URL de una ubicación. Lo que falta sale de la actual; el bloque se olvida al cambiar de vista. */
export function hrefDe(u: Partial<Ubicacion>): string {
  const actual = leerUbicacion();
  const vista = u.vista ?? actual.vista;
  const cliente = u.cliente !== undefined ? u.cliente : actual.cliente;
  let bloque: string | null = null;
  if (vista === "configuracion") {
    if (u.bloque !== undefined) bloque = u.bloque;
    else if (u.vista === undefined || u.vista === actual.vista) bloque = actual.bloque;
  }
  let ancla = "";
  if (vista === "clientes") ancla = "#clientes";
  else if (vista === "productos") ancla = "#productos";
  else if (vista === "ventas") ancla = "#ventas";
  else if (vista === "agenda") ancla = "#agenda";
  else if (vista === "configuracion") {
    const seccion = bloque ? SECCIONES_CONFIGURACION.find((s) => s.id === bloque) : undefined;
    ancla = bloque ? `#ajustes-${seccion ? seccion.ancla : bloque}` : "#ajustes";
  }
  return `/panel${cliente ? `?cliente=${encodeURIComponent(cliente)}` : ""}${ancla}`;
}

declare global {
  var __crm_oyentes: Set<() => void> | undefined;
}

function obtenerOyentes(): Set<() => void> {
  if (typeof window !== "undefined") {
    if (!window.__crm_oyentes) {
      window.__crm_oyentes = new Set();
    }
    return window.__crm_oyentes;
  }
  return new Set();
}

function notificar(): void {
  for (const oyente of obtenerOyentes()) {
    try {
      oyente();
    } catch {
      // Ignorar fallos de oyentes
    }
  }
}

function cambiarUrl(u: Partial<Ubicacion>): void {
  if (typeof window === "undefined") return;
  const nuevoHref = hrefDe(u);
  guardada = null;
  try {
    history.pushState(history.state, "", nuevoHref);
  } catch {
    window.location.href = nuevoHref;
  }
  window.dispatchEvent(new Event("hashchange"));
  window.dispatchEvent(new Event("popstate"));
  window.dispatchEvent(new CustomEvent("crm-navegacion", { detail: u }));
  notificar();
}

export function irA(vista: Vista, o?: { bloque?: string }): void {
  cambiarUrl(o?.bloque !== undefined ? { vista, bloque: o.bloque } : { vista });
}

export function abrirCliente(id: string): void {
  cambiarUrl({ cliente: id });
}

export function cerrarCliente(): void {
  cambiarUrl({ cliente: null });
}

function suscribir(avisar: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const oyentes = obtenerOyentes();
  oyentes.add(avisar);
  window.addEventListener("popstate", avisar);
  window.addEventListener("hashchange", avisar);
  window.addEventListener("crm-navegacion", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("popstate", avisar);
    window.removeEventListener("hashchange", avisar);
    window.removeEventListener("crm-navegacion", avisar);
  };
}

// El mismo objeto mientras la URL no cambia: useSyncExternalStore compara por identidad.
let guardada: { href: string; ubicacion: Ubicacion } | null = null;

function instantanea(): Ubicacion {
  if (typeof window === "undefined") return INICIO;
  const href = window.location.href;
  if (!guardada || guardada.href !== href) {
    guardada = { href, ubicacion: leerUbicacion(href) };
  }
  return guardada.ubicacion;
}

// El servidor pinta siempre «hoy»: así no hay diferencias al hidratar.
function instantaneaServidor(): Ubicacion {
  return INICIO;
}

export function useUbicacion(): Ubicacion {
  return useSyncExternalStore(suscribir, instantanea, instantaneaServidor);
}
